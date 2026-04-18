import joblib
import pandas as pd

model = joblib.load("ml_model/model.pkl")

def predict_anomaly(runtime_data):
    feature_names = [
        "session_duration_minutes",
        "active_sessions",
        "unique_devices_used",
        "login_frequency_per_day",
        "anomaly_score"
    ]

    features_df = pd.DataFrame([{name: runtime_data[name] for name in feature_names}])
    prediction = model.predict(features_df)

    return 1 if prediction[0] == -1 else 0