# Anomaly Detection Module
# This module will later integrate with the machine learning model

def detect_anomaly(data):
    """
    Detects suspicious software usage.
    Currently rule-based, later will use ML model.
    """

    devices = data.get("devices")

    if devices > 2:
        return {
            "prediction": "anomaly",
            "threat_level": "high"
        }

    return {
        "prediction": "normal",
        "threat_level": "low"
    }