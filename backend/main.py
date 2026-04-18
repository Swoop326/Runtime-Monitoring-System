from fastapi import FastAPI
import uuid
import datetime
from datetime import timedelta
from fastapi import Request
from collections import Counter
import json
import time
import csv
import io

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from runtime_monitor.monitor import start_monitoring, stop_monitoring, record_event
from runtime_monitor.device import get_device_id

from ml_model.anomaly_predictor import predict_anomaly
from trust_score_policy_engine import RuntimeMetrics, TrustScoreEngine, PolicyEngine

from database.database import (
    create_license,
    get_license,
    activate_license_db,
    create_user,
    get_user,
    verify_user_password,
    add_login_timestamp,
    update_devices
)

from database.mongo_connection import users_collection, licenses_collection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# HOME
# -------------------------
@app.get("/")
def home():
    return {"message": "Adaptive Runtime License Validation System Running"}


# -------------------------
# LICENSE MANAGEMENT
# -------------------------
@app.post("/generate-license")
def generate_license():

    license_key = str(uuid.uuid4())
    created_at = str(datetime.datetime.now())

    create_license(license_key, created_at)

    return {"license_key": license_key}


@app.post("/activate-license")
def activate_license(data: dict):

    license_key = data.get("license_key")
    device_id = data.get("device_id")
    user_email = data.get("user_email")
    override = data.get("override", False)   # 🔥 for switching device

    license_data = get_license(license_key)

    if not license_data:
        return {
            "success": False,
            "message": "Invalid license"
        }

    devices = license_data.get("devices_used", [])

    # ✅ FIRST TIME ACTIVATION
    if len(devices) == 0:
        update_devices(license_key, [device_id])

        update_data = {"active": True}
        if user_email:
            update_data["user_email"] = user_email

        licenses_collection.update_one(
            {"license_key": license_key},
            {"$set": update_data}
        )

        return {
            "success": True,
            "message": "License activated successfully"
        }

    # ✅ SAME DEVICE LOGIN (VERY IMPORTANT FIX)
    if device_id in devices:
        return {
            "success": True,
            "message": "Welcome back"
        }

    # 🔥 DIFFERENT DEVICE → ASK OVERRIDE
    if not override:
        return {
            "success": False,
            "override_required": True,
            "message": "License already active on another device. Switch?"
        }

    # 🔥 OVERRIDE = TRUE → SWITCH DEVICE
    update_devices(license_key, [device_id])

    update_data = {"active": True}
    if user_email:
        update_data["user_email"] = user_email

    licenses_collection.update_one(
        {"license_key": license_key},
        {"$set": update_data}
    )

    return {
        "success": True,
        "message": "Device switched successfully"
    }

@app.post("/validate-license")
def validate_license_api(data: dict):

    license_key = data.get("license_key")
    device_id = data.get("device_id")

    license_data = get_license(license_key)

    if not license_data:
        return {"valid": False}

    if not license_data.get("active"):
        return {"valid": False}

    if device_id not in license_data.get("devices_used", []):
        return {"valid": False}

    return {"valid": True}


# -------------------------
# USER AUTH
# -------------------------
@app.post("/signup")
def signup(data: dict):

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return {"success": False, "message": "Missing fields"}

    success = create_user(username, email, password)
    if not success:
        return {"success": False, "message": "Username or email already exists"}

    return {"success": True, "message": "User created successfully"}


@app.post("/login")
def login(data: dict):

    email = data.get("email")
    password = data.get("password")

    user = get_user(email)

    if user and verify_user_password(email, password):
        add_login_timestamp(email)
        return {
            "success": True,
            "username": user["username"],
            "role": user.get("role", "user")
        }

    return {"success": False, "message": "Invalid credentials"}


# -------------------------
# RUNTIME MONITORING
# -------------------------
@app.post("/start-session")
def start_session():

    try:
        start_monitoring()
        return {"success": True}
    except:
        return {"success": False}


@app.post("/end-session")
def end_session():

    try:
        stop_monitoring()
        return {"success": True}
    except:
        return {"success": False}


@app.post("/log-event")
def log_event_api(data: dict):

    event = data.get("event")
    license_key = data.get("license_key")
    device_id = data.get("device_id")
    timestamp = data.get("timestamp", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    license_data = get_license(license_key)

    if not license_data:
        return {"success": False, "message": "Invalid license"}

    devices = license_data.get("devices_used", [])

    # 🚫 BLOCK OLD DEVICE HERE
    if device_id not in devices:
        return {
            "success": False,
            "message": "Session expired (another device logged in)"
        }

    # ✅ ONLY VALID DEVICE CAN LOG
    record_event(event, license_key=license_key)

    # 🔥 ENHANCED BEHAVIOR LOGGING
    behavior_data = {
        "timestamp": timestamp,
        "event": event,
        "device_id": device_id,
        "license_key": license_key,
        "user_agent": data.get("user_agent", ""),
        "ip_address": data.get("ip_address", ""),
        "session_duration": data.get("session_duration", 0),
        "keystroke_pattern": data.get("keystroke_pattern", ""),
        "mouse_movements": data.get("mouse_movements", ""),
        "behavior_score": data.get("behavior_score", 0)
    }

    # Save to enhanced behavior log
    try:
        with open(f"logs/behavior_{license_key}.jsonl", "a") as f:
            f.write(json.dumps(behavior_data) + "\n")
    except:
        pass

    return {"success": True}

# -------------------------
# LICENSE LIST (MongoDB)
# -------------------------
@app.get("/licenses")
def get_all_licenses():

    licenses = list(licenses_collection.find({}, {"_id": 0}))

    return licenses


# -------------------------
# ML + TRUST SCORE
# -------------------------
@app.post("/detect-anomaly")
def detect_anomaly_api(data: dict):

    prediction = predict_anomaly(data)

    return {
        "prediction": "anomaly" if prediction == 1 else "normal"
    }


@app.post("/evaluate-runtime")
def evaluate_runtime(data: dict):

    anomaly_prediction = predict_anomaly(data)
    anomaly_score = 1 if anomaly_prediction == 1 else 0

    metrics = RuntimeMetrics(
        device_id=data.get("device_id"),
        session_count=data.get("active_sessions"),
        anomaly_score=anomaly_score,
        usage_frequency=data.get("login_frequency_per_day"),
        execution_duration=data.get("session_duration_minutes"),
        location_change=data.get("geo_location_change")
    )

    trust_engine = TrustScoreEngine()
    trust_engine.evaluate_runtime(metrics)

    trust_score = trust_engine.get_score()

    policy_engine = PolicyEngine()
    decision = policy_engine.evaluate_policy(trust_score)

    return {
        "anomaly_prediction": anomaly_prediction,
        "trust_score": trust_score,
        "policy_decision": decision
    }


# -------------------------
# TRUST SCORE (TEMP FILE BASED)
# -------------------------

@app.get("/trust-scores")
def dynamic_trust_scores(request: Request):

    import json
    import time

    device_id = request.query_params.get("device_id")
    license_key = request.query_params.get("license_key")

    # 🔥 GET LICENSE DATA
    license_data = licenses_collection.find_one({"license_key": license_key})

    if not license_data:
        return {
            "device_id": device_id,
            "trust_score": 0,
            "policy": "INVALID LICENSE",
            "events_detected": 0
        }

    devices_used = license_data.get("devices_used", [])
    active_sessions = len(devices_used)

    # 🔥 LOAD LOGS
    logs = []
    try:
        with open(f"logs/{license_key}.txt", "r") as file:
            for line in file:
                logs.append(line.strip())
    except:
        pass

    total_events = len(logs)

    # ✅ 🔥 FIXED EVENT RATE (REAL-TIME WINDOW)
    now = datetime.datetime.now()
    window = timedelta(seconds=5)
    recent_events = []

    for log in logs:
        try:
            parsed = json.loads(log)

            log_time = datetime.datetime.strptime(
                parsed["timestamp"], "%Y-%m-%d %H:%M:%S"
            )

            if now - log_time <= window:
                recent_events.append(parsed)

        except Exception as e:
            print("TIME PARSE ERROR:", e)

    event_rate = len(recent_events) / 5

    print("🔥 EVENT RATE:", event_rate)

    # 🔥 FEATURE ENGINEERING
    usage_frequency = int(event_rate * 5)
    execution_duration = total_events // 10

    # 🔥 LOGIN FREQUENCY PER DAY (BEHAVIORAL METRIC)
    login_frequency_per_day = usage_frequency
    if license_data.get("user_email"):
        user_data = users_collection.find_one({"email": license_data.get("user_email")})
        if user_data:
            login_timestamps = user_data.get("login_timestamps", [])
            one_day_ago = now - timedelta(days=1)
            login_frequency_per_day = sum(
                1
                for ts in login_timestamps
                if datetime.datetime.strptime(ts, "%Y-%m-%d %H:%M:%S") >= one_day_ago
            )

    # 🔥 ML INPUT
    runtime_data = {
        "session_duration_minutes": execution_duration,
        "active_sessions": active_sessions,
        "unique_devices_used": len(devices_used),
        "login_frequency_per_day": login_frequency_per_day,
        "geo_location_change": 0,
        "vpn_detected": 0,
        "rule_violation_flag": 0,
        "anomaly_score": event_rate,   # ML input
        "trust_score": 100
    }

    # 🔥 ML PREDICTION
    try:
        ml_prediction = predict_anomaly(runtime_data)
        anomaly_score = 1 if ml_prediction == 1 else 0
    except Exception as e:
        print("ML ERROR:", e)
        anomaly_score = 0

    # 🔥 GET LATEST ANOMALY TIME
    db_data = licenses_collection.find_one({"license_key": license_key})
    last_anomaly_time = db_data.get("last_anomaly_time", 0)

    current_time = time.time()
    hold_window_seconds = 5
    hold_active = current_time - last_anomaly_time < hold_window_seconds

    # 🔥 HARD RULE (FAST SPAM DETECTION)
    anomaly_penalty_allowed = False
    if event_rate > 2.4:
        anomaly_score = 1
        if not hold_active:
            anomaly_penalty_allowed = True
            licenses_collection.update_one(
                {"license_key": license_key},
                {"$set": {"last_anomaly_time": current_time}}
            )
            last_anomaly_time = current_time
            hold_active = True
            print("🚨 HIGH SPEED DETECTED")
        else:
            print("🚨 HIGH SPEED DETECTED (hold window, no repeated trust penalty)")

    # 🔥 HOLD ANOMALY FOR 5 SEC (IMPORTANT FOR UI)
    if hold_active:
        anomaly_score = 1

    print("ANOMALY SCORE:", anomaly_score)

    prev_score = license_data.get("trust_score", 100)

    if hold_active and not anomaly_penalty_allowed:
        # Keep the current trust score stable during the anomaly hold window
        score = prev_score
        print("⚠️ Maintaining trust score during anomaly hold window:", score)
    else:
        # 🔥 TRUST SCORE ENGINE
        metrics = RuntimeMetrics(
            device_id=device_id,
            session_count=active_sessions,
            anomaly_score=anomaly_score if anomaly_penalty_allowed else 0,
            usage_frequency=usage_frequency if not hold_active else 0,  # Suppress secondary penalties during hold
            execution_duration=execution_duration if not hold_active else 0,  # Suppress secondary penalties during hold
            location_change=False
        )

        trust_engine = TrustScoreEngine()
        trust_engine.score = prev_score   # ✅ CONTINUE FROM LAST SCORE

        trust_engine.evaluate_runtime(metrics)
        score = trust_engine.get_score()

        # 🔥 SAVE UPDATED SCORE
        licenses_collection.update_one(
            {"license_key": license_key},
            {"$set": {"trust_score": score}}
        )

    # 🔥 POLICY ENGINE
    policy_engine = PolicyEngine()
    decision = policy_engine.evaluate_policy(score)

    return {
        "device_id": device_id,
        "trust_score": score,
        "policy": decision["action"],
        "events_detected": total_events,
        "event_rate": round(event_rate, 2),
        "login_frequency_per_day": login_frequency_per_day,
        "ml_prediction": "anomaly" if anomaly_score == 1 else "normal",
        "anomaly_score": anomaly_score,
        "model_name": "IsolationForest",
        "last_ml_inference": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "feature_inputs": {
            "session_duration_minutes": execution_duration,
            "active_sessions": active_sessions,
            "unique_devices_used": len(devices_used),
            "login_frequency_per_day": login_frequency_per_day,
            "anomaly_score": round(event_rate, 2),
            "trust_score": prev_score
        }
    }

@app.get("/adaptive-challenge")
def get_adaptive_challenge(request: Request):
    device_id = request.query_params.get("device_id")
    license_key = request.query_params.get("license_key")

    # Get current risk assessment
    trust_response = dynamic_trust_scores(request)
    trust_score = trust_response.get("trust_score", 100)
    event_rate = trust_response.get("event_rate", 0)

    challenges = []

    # 🔥 HIGH RISK → MULTI-FACTOR CHALLENGES
    if trust_score < 30 or event_rate > 10:
        challenges = [
            {"type": "biometric", "message": "Please provide fingerprint verification"},
            {"type": "location", "message": "Verify your current location"},
            {"type": "behavior", "message": "Complete behavioral verification"}
        ]

    # 🔥 MEDIUM RISK → SINGLE CHALLENGE
    elif trust_score < 70 or event_rate > 5:
        challenges = [
            {"type": "captcha", "message": "Please solve the security puzzle"}
        ]

    # 🔥 LOW RISK → NO CHALLENGE
    else:
        challenges = []

    return {
        "challenges_required": len(challenges) > 0,
        "challenges": challenges,
        "risk_level": "high" if trust_score < 30 else "medium" if trust_score < 70 else "low"
    }


@app.get("/behavior-profile")
def get_behavior_profile(license_key: str):
    """Generate user behavior profile for adaptive authentication"""

    try:
        # Load behavior logs
        behavior_logs = []
        try:
            with open(f"logs/behavior_{license_key}.jsonl", "r") as f:
                for line in f:
                    behavior_logs.append(json.loads(line))
        except FileNotFoundError:
            pass

        if not behavior_logs:
            return {"profile": "insufficient_data", "confidence": 0}

        # Analyze patterns
        total_events = len(behavior_logs)
        avg_session_duration = sum(log.get("session_duration", 0) for log in behavior_logs) / max(total_events, 1)

        # Time-based patterns
        hour_counts = {}
        for log in behavior_logs:
            try:
                dt = datetime.datetime.strptime(log["timestamp"], "%Y-%m-%d %H:%M:%S")
                hour = dt.hour
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            except:
                continue

        peak_hour = max(hour_counts.keys(), key=lambda h: hour_counts[h]) if hour_counts else 0

        # Device consistency
        devices = set(log.get("device_id", "") for log in behavior_logs)
        device_consistency = len(devices) <= 2  # Allow 1-2 devices

        # Behavior score
        behavior_score = min(100, (total_events * 2) + (avg_session_duration * 0.1) + (device_consistency * 20))

        return {
            "profile": {
                "total_events": total_events,
                "avg_session_duration": round(avg_session_duration, 2),
                "peak_usage_hour": peak_hour,
                "device_consistency": device_consistency,
                "unique_devices": len(devices)
            },
            "behavior_score": round(behavior_score, 2),
            "confidence": min(100, total_events * 5)  # Confidence increases with data
        }

    except Exception as e:
        return {"error": str(e)}

    license_data = licenses_collection.find_one({"license_key": license_key})

    if not license_data:
        return {"error": "Invalid license"}

    logs = []
    log_file = f"logs/{license_key}.txt"

    try:
        with open(log_file, "r") as file:
            for line in file:
                if line.strip():
                    logs.append(json.loads(line.strip()))
    except FileNotFoundError:
        pass
    except Exception:
        pass

    now = datetime.datetime.now()
    window = timedelta(seconds=5)
    recent_events = []

    for log in logs:
        try:
            log_time = datetime.datetime.strptime(log["timestamp"], "%Y-%m-%d %H:%M:%S")
            if now - log_time <= window:
                recent_events.append(log)
        except Exception:
            continue

    event_rate = len(recent_events) / 5 if logs else 0

    summary = {
        "license_key": license_key,
        "devices_used": license_data.get("devices_used", []),
        "trust_score": license_data.get("trust_score", 100),
        "policy": PolicyEngine().evaluate_policy(license_data.get("trust_score", 100))["action"],
        "events_detected": len(logs),
        "event_rate": round(event_rate, 2),
        "generated_at": now.strftime("%Y-%m-%d %H:%M:%S")
    }

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["USER BEHAVIOR REPORT"])
    writer.writerow(["License Key", summary["license_key"]])
    writer.writerow(["Devices Used", ", ".join(summary["devices_used"]) or "None"])
    writer.writerow(["Trust Score", summary["trust_score"]])
    writer.writerow(["Policy", summary["policy"]])
    writer.writerow(["Events Detected", summary["events_detected"]])
    writer.writerow(["Recent Event Rate", summary["event_rate"]])
    writer.writerow(["Report Generated", summary["generated_at"]])
    writer.writerow([])
    writer.writerow(["timestamp", "event", "device", "duration"])

    for log in logs:
        writer.writerow([
            log.get("timestamp", ""),
            log.get("event", ""),
            log.get("device", ""),
            log.get("duration", "")
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=behavior_report_{license_key}.csv"}
    )


@app.post("/update-trust-score")
def update_trust_score(data: dict):

    license_key = data.get("license_key")
    new_score = data.get("trust_score")

    if not license_key or new_score is None:
        return {"success": False, "message": "license_key and trust_score are required"}

    try:
        new_score = int(new_score)
    except Exception:
        return {"success": False, "message": "trust_score must be an integer"}

    if new_score < 0 or new_score > 100:
        return {"success": False, "message": "trust_score must be between 0 and 100"}

    license_data = licenses_collection.find_one({"license_key": license_key})

    if not license_data:
        return {"success": False, "message": "Invalid license"}

    licenses_collection.update_one(
        {"license_key": license_key},
        {"$set": {"trust_score": new_score}}
    )

    return {"success": True, "message": "Trust score updated successfully", "trust_score": new_score}


@app.post("/force-switch")
def force_switch(data: dict):

    license_key = data.get("license_key")
    device_id = data.get("device_id")

    license_data = get_license(license_key)

    if not license_data:
        return {"success": False}

    # 🔥 Replace old device
    update_devices(license_key, [device_id])

    return {
        "success": True,
        "message": "Switched device successfully"
    }