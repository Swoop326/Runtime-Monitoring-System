import pandas as pd
import numpy as np

data = []

for i in range(1000):

    # ✅ NORMAL USERS
    if i < 800:
        row = {
            "session_duration_minutes": np.random.randint(5, 60),
            "active_sessions": np.random.randint(1, 2),
            "unique_devices_used": np.random.randint(1, 2),
            "login_frequency_per_day": np.random.randint(1, 10),
            "anomaly_score": np.random.uniform(0.5, 2.0)   # LOW event rate
        }

    # 🔥 ANOMALY USERS
    else:
        row = {
            "session_duration_minutes": np.random.randint(1, 10),
            "active_sessions": np.random.randint(1, 4),
            "unique_devices_used": np.random.randint(1, 3),
            "login_frequency_per_day": np.random.randint(5, 40),
            "anomaly_score": np.random.uniform(2.5, 8.0)   # 🔥 MODERATE/HIGH event rate
        }

    data.append(row)

df = pd.DataFrame(data)
df.to_csv("ml_model/runtime_dataset.csv", index=False)

print("🔥 New dataset generated")