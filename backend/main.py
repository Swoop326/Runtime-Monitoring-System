from fastapi import FastAPI
import uuid
from datetime import datetime, timedelta
from fastapi import Request
from collections import Counter
import datetime
import json
import time

from fastapi.middleware.cors import CORSMiddleware

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
    update_devices
)

from database.mongo_connection import licenses_collection

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

        licenses_collection.update_one(
            {"license_key": license_key},
            {"$set": {"active": True}}
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

    licenses_collection.update_one(
        {"license_key": license_key},
        {"$set": {"active": True}}
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

    create_user(username, email, password)

    return {"success": True, "message": "User created successfully"}


@app.post("/login")
def login(data: dict):

    email = data.get("email")
    password = data.get("password")

    user = get_user(email)

    if user and user["password"] == password:
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
    device_id = data.get("device_id")   # 🔥 ADD THIS

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
    from datetime import datetime, timedelta

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
    now = datetime.now()
    window = timedelta(seconds=5)
    recent_events = []

    for log in logs:
        try:
            parsed = json.loads(log)

            log_time = datetime.strptime(
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

    # 🔥 ML INPUT
    runtime_data = {
        "session_duration_minutes": execution_duration,
        "active_sessions": active_sessions,
        "unique_devices_used": len(devices_used),
        "login_frequency_per_day": usage_frequency,
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

    # 🔥 HARD RULE (FAST SPAM DETECTION)
    if event_rate > 5:
        anomaly_score = 1

        licenses_collection.update_one(
            {"license_key": license_key},
            {"$set": {"last_anomaly_time": current_time}}
        )

        last_anomaly_time = current_time

        print("🚨 HIGH SPEED DETECTED")

    # 🔥 HOLD ANOMALY FOR 5 SEC (IMPORTANT FOR UI)
    if current_time - last_anomaly_time < 5:
        anomaly_score = 1

    print("ANOMALY SCORE:", anomaly_score)

    # 🔥 TRUST SCORE ENGINE
    metrics = RuntimeMetrics(
        device_id=device_id,
        session_count=active_sessions,
        anomaly_score=anomaly_score,
        usage_frequency=usage_frequency,
        execution_duration=execution_duration,
        location_change=False
    )

    prev_score = license_data.get("trust_score", 100)

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
        "ml_prediction": "anomaly" if anomaly_score == 1 else "normal",
        "anomaly_score": anomaly_score
    }

@app.get("/logs")
def get_logs(license_key: str):

    logs = []
    log_file = f"logs/{license_key}.txt"

    try:
        with open(log_file, "r") as file:
            for line in file:
                logs.append(line.strip())
    except:
        pass

    return logs


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