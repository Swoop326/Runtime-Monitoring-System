import joblib
import numpy as np

model = joblib.load("ml_model/model.pkl")

def predict_anomaly(runtime_data):

    features = np.array([[
        runtime_data["session_duration_minutes"],
        runtime_data["active_sessions"],
        runtime_data["unique_devices_used"],
        runtime_data["login_frequency_per_day"],
        runtime_data["geo_location_change"],
        runtime_data["vpn_detected"],
        runtime_data["rule_violation_flag"],
        runtime_data["anomaly_score"],
        runtime_data["trust_score"]
    ]])

    prediction = model.predict(features)

    if prediction[0] == -1:
        return 1
    else:
        return 0