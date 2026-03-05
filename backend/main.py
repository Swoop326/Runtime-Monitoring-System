from fastapi import FastAPI
from license_manager import validate_license
from anomaly_detection import detect_anomaly
from trust_score import update_trust_score

app = FastAPI()

# Home endpoint (server check)
@app.get("/")
def home():
    return {"message": "Adaptive Runtime License Validation System Running"}


# License activation endpoint
@app.post("/activate-license")
def activate_license(data: dict):

    license_key = data.get("license_key")

    if validate_license(license_key):
        return {"status": "valid"}

    return {"status": "invalid"}


# Runtime monitoring endpoint
@app.post("/runtime-data")
def runtime_data(data: dict):

    usage_time = data.get("usage_time")
    devices = data.get("devices")

    return {
        "message": "Runtime data received",
        "usage_time": usage_time,
        "devices": devices
    }


# Anomaly detection endpoint
@app.post("/detect-anomaly")
def analyze_runtime(data: dict):

    result = detect_anomaly(data)

    trust = update_trust_score(result["threat_level"])

    return {
        "prediction": result["prediction"],
        "threat_level": result["threat_level"],
        "trust_score": trust
    }