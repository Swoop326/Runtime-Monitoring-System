import json
import datetime
import os

def log_event(event, device=None, duration=None, license_key=None):

    log_data = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "event": event
    }

    if device:
        log_data["device"] = device

    if duration:
        log_data["duration"] = duration

    # 🔥 PER USER LOG FILE
    log_file = f"logs/{license_key}.txt"

    os.makedirs("logs", exist_ok=True)

    with open(log_file, "a") as file:
        file.write(json.dumps(log_data) + "\n")