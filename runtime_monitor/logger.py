import json
import datetime
from runtime_monitor.config import LOG_FILE


def log_event(event, device=None, duration=None):

    log_data = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "event": event
    }

    if device:
        log_data["device"] = device

    if duration:
        log_data["duration"] = duration

    with open(LOG_FILE, "a") as file:
        file.write(json.dumps(log_data) + "\n")