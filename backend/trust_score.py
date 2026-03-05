# Trust Score Module
# Maintains adaptive trust score for software usage

trust_score = 100

def update_trust_score(threat_level):
    """
    Updates trust score based on detected threat level.
    """

    global trust_score

    if threat_level == "high":
        trust_score -= 30

    elif threat_level == "medium":
        trust_score -= 15

    return trust_score