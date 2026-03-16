from fastapi import FastAPI
import uuid
import datetime
import sqlite3

from runtime_monitor.monitor import start_monitoring, stop_monitoring
from ml_model.anomaly_predictor import predict_anomaly
from trust_score_policy_engine import RuntimeMetrics, TrustScoreEngine, PolicyEngine
from fastapi.middleware.cors import CORSMiddleware
from runtime_monitor.monitor import start_monitoring, stop_monitoring, record_event
from runtime_monitor.device import get_device_id
from database.database import activate_license_db

USER_DB = "database/users.db"

from database.database import (
    create_license,
    get_license,
    activate_license_db,
    create_user
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Home Endpoint
@app.get("/")
def home():
    return {"message": "Adaptive Runtime License Validation System Running"}


# Generate License
@app.post("/generate-license")
def generate_license():

    license_key = str(uuid.uuid4())
    created_at = str(datetime.datetime.now())

    create_license(license_key, created_at)

    return {"license_key": license_key}


# Activate License
@app.post("/activate-license")
def activate_license(data: dict):

    license_key = data.get("license_key")
    device_id = get_device_id()

    license_data = get_license(license_key)

    if not license_data:
        return {
            "success": False,
            "message": "Invalid license key"
        }

    if license_data["active"] == 1:
        return {
            "success": False,
            "message": "License already used"
        }

    activate_license_db(license_key, device_id)

    return {
        "success": True,
        "message": "License activated successfully"
    }

# Validate License
@app.post("/validate-license")
def validate_license_api(data: dict):

    license_key = data.get("license_key")
    device_id = data.get("device_id")

    license_data = get_license(license_key)

    if not license_data:
        return {"valid": False}

    if license_data["active"] == 0:
        return {"valid": False}

    if license_data["device_id"] != device_id:
        return {"valid": False}

    return {"valid": True}

# Runtime Monitoring Data
@app.post("/runtime-data")
def runtime_data(data: dict):

    usage_time = data.get("usage_time")
    devices = data.get("devices")

    return {
        "message": "Runtime data received",
        "usage_time": usage_time,
        "devices": devices
    }


# ML Anomaly Detection
@app.post("/detect-anomaly")
def detect_anomaly_api(data: dict):

    prediction = predict_anomaly(data)

    return {
        "prediction": "anomaly" if prediction == 1 else "normal"
    }



# Full Evaluation
# (ML + Trust Score + Policy)
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

# Start Runtime Monitoring
@app.get("/start-monitor")
def start_runtime_monitor():

    try:
        start_monitoring()
        return {"message": "Runtime monitoring started"}
    except:
        return {"message": "monitor already running"}



# Stop Runtime Monitoring
@app.get("/stop-monitor")
def stop_runtime_monitor():

    try:
        stop_monitoring()
        return {"message": "Runtime monitoring stopped"}
    except:
        return {"message": "monitor not running"}
    
# Signup Route
@app.post("/signup")
def signup(data: dict):

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return {"success": False, "message": "Missing fields"}

    create_user(username, email, password)

    return {
        "success": True,
        "message": "User created successfully"
    }

# Login Route
@app.post("/login")
def login(data: dict):

    email = data.get("email")
    password = data.get("password")

    conn = sqlite3.connect("database/licenses.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT username, role FROM users WHERE email=? AND password=?",
        (email,password)
    )

    user = cursor.fetchone()

    if user:

        return {
            "success": True,
            "username": user[0],
            "role": user[1]
        }

    return {
        "success": False,
        "message": "Invalid credentials"
    }
    
# Start session
@app.post("/start-session")
def start_session():

    try:
        start_monitoring()
        return {"success": True}
    except:
        return {"success": False}
    
# End session
@app.post("/end-session")
def end_session():

    try:
        stop_monitoring()
        return {"success": True}
    except:
        return {"success": False}
    
# Log events route

@app.post("/log-event")
def log_event(data: dict):

    event = data.get("event")

    record_event(event)

    return {"success": True}

# Generate License
@app.get("/licenses")
def get_all_licenses():

    conn = sqlite3.connect("database/licenses.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM licenses")
    licenses = cursor.fetchall()

    conn.close()

    return [dict(row) for row in licenses]

# Logs
@app.get("/logs")
def get_logs():

    logs = []

    try:
        with open("logs/runtime_log.txt", "r") as file:
            for line in file:
                logs.append(line.strip())
    except:
        pass

    return logs

# Trust score
@app.post("/trust-score")
def trust_score(data: dict):

    from trust_score_policy_engine import RuntimeMetrics, TrustScoreEngine

    metrics = RuntimeMetrics(
        device_id=data.get("device_id"),
        session_count=data.get("session_count"),
        anomaly_score=data.get("anomaly_score"),
        usage_frequency=data.get("usage_frequency"),
        execution_duration=data.get("execution_duration"),
        location_change=data.get("location_change")
    )

    engine = TrustScoreEngine()
    engine.evaluate_runtime(metrics)

    score = engine.get_score()

    return {
        "trust_score": score
    }

# Trust scores
from runtime_monitor.device import get_device_id

@app.get("/trust-scores")
def dynamic_trust_scores():

    logs = []

    try:
        with open("logs/runtime_log.txt", "r") as file:
            for line in file:
                logs.append(line.strip())
    except:
        pass

    # If no runtime activity, return idle state
    if len(logs) == 0:
        return {
            "device_id": None,
            "trust_score": None,
            "policy": "NO ACTIVE SESSION",
            "events_detected": 0
        }

    # get device id dynamically
    device_id = get_device_id()

    # runtime metrics derived from logs
    active_sessions = 1
    session_duration_minutes = min(len(logs), 60)
    login_frequency_per_day = 2
    geo_location_change = False
    anomaly_score = 0

    metrics = RuntimeMetrics(
        device_id=device_id,
        session_count=active_sessions,
        anomaly_score=anomaly_score,
        usage_frequency=login_frequency_per_day,
        execution_duration=session_duration_minutes,
        location_change=geo_location_change
    )

    trust_engine = TrustScoreEngine()
    trust_engine.evaluate_runtime(metrics)

    score = trust_engine.get_score()

    policy_engine = PolicyEngine()
    decision = policy_engine.evaluate_policy(score)

    return {
        "device_id": device_id,
        "trust_score": score,
        "policy": decision["action"],
        "events_detected": len(logs)
    }