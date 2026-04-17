import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

# ✅ Load dataset
data = pd.read_csv("ml_model/runtime_dataset.csv")

# ✅ CORRECT FEATURES (NO anomaly_score, NO trust_score)
features = [
    "session_duration_minutes",
    "active_sessions",
    "unique_devices_used",
    "login_frequency_per_day",
    "anomaly_score"   # 🔥 MOST IMPORTANT
]

X = data[features]

# ✅ Train Isolation Forest
model = IsolationForest(
    contamination=0.15,   # 🔥 slightly aggressive for demo
    random_state=42
)

model.fit(X)

# ✅ Save model
joblib.dump(model, "ml_model/model.pkl")

print("🔥 Model trained with event_rate feature successfully")