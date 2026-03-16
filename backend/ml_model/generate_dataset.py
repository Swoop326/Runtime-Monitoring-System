import pandas as pd
import random

rows = []

# NORMAL USERS
for _ in range(700):

    session_duration = random.randint(5, 120)
    login_frequency = random.randint(1, 15)
    active_sessions = random.randint(1,2)
    geo_change = random.choice([0,0,0,1])
    device_change = random.choice([0,0,1])
    event_count = random.randint(5,60)

    rows.append([
        session_duration,
        login_frequency,
        active_sessions,
        geo_change,
        device_change,
        event_count,
        0
    ])

# ANOMALOUS USERS
for _ in range(300):

    session_duration = random.randint(40,300)
    login_frequency = random.randint(8,60)
    active_sessions = random.randint(2,8)
    geo_change = random.choice([0,1])
    device_change = random.choice([0,1])
    event_count = random.randint(30,200)

    rows.append([
        session_duration,
        login_frequency,
        active_sessions,
        geo_change,
        device_change,
        event_count,
        1
    ])

columns = [
    "session_duration_minutes",
    "login_frequency_per_day",
    "active_sessions",
    "geo_location_change",
    "device_change",
    "event_count",
    "label"
]

df = pd.DataFrame(rows, columns=columns)
df = df.sample(frac=1).reset_index(drop=True)

df.to_csv("runtime_dataset.csv", index=False)

print("Dataset generated successfully:", len(df))