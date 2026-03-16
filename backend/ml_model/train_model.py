import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

data = pd.read_csv("license_validation_dataset.csv")

features = [
    "session_duration_minutes",
    "active_sessions",
    "unique_devices_used",
    "login_frequency_per_day",
    "geo_location_change",
    "vpn_detected",
    "rule_violation_flag",
    "anomaly_score",
    "trust_score"
]

X = data[features]

model = IsolationForest(contamination=0.1, random_state=42)
model.fit(X)

joblib.dump(model, "model.pkl")

print("Model trained and saved successfully")