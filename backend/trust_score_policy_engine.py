import logging
from dataclasses import dataclass
from typing import Dict

# Logging Configuration
logging.basicConfig(
    filename="license_runtime.log",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# Runtime Metrics Data Model
@dataclass
class RuntimeMetrics:
    device_id: str
    session_count: int
    anomaly_score: float
    usage_frequency: int
    execution_duration: int
    location_change: bool

# Trust Score Engine
class TrustScoreEngine:

    MAX_SCORE = 100
    MIN_SCORE = 0

    def __init__(self):

        self.score = self.MAX_SCORE

        self.penalties: Dict[str, int] = {
            "multiple_sessions": 20,
            "high_anomaly": 20,
            "excess_usage": 20,
            "long_execution": 20,
            "location_change": 15
        }

        logging.info("Trust Score Engine initialized")

    # Apply penalty
    def apply_penalty(self, reason: str):

        if reason in self.penalties:
            penalty = self.penalties[reason]
            self.score -= penalty

            logging.warning(
                f"Penalty applied: {reason} (-{penalty}) | New Score: {self.score}"
            )

    # Evaluate runtime behaviour
    def evaluate_runtime(self, metrics: RuntimeMetrics):

        try:
            penalty_applied = False   # ✅ control system

            # 🔥 PRIORITY 1 → ANOMALY (MAIN SIGNAL)
            if metrics.anomaly_score > 0.75:
                self.apply_penalty("high_anomaly")
                penalty_applied = True

            # 🔥 PRIORITY 2 → ONLY ONE SECONDARY PENALTY
            if not penalty_applied:

                if metrics.usage_frequency > 12:
                    self.apply_penalty("excess_usage")

                elif metrics.execution_duration > 8:
                    self.apply_penalty("long_execution")

                elif metrics.session_count > 1:
                    self.apply_penalty("multiple_sessions")

            # 🔥 LOW IMPACT (always allowed)
            if metrics.location_change:
                self.apply_penalty("location_change")

            self.normalize_score()

        except Exception as e:
            logging.error(f"Runtime evaluation failed: {str(e)}")

    # Normalize score range
    def normalize_score(self):

        if self.score > self.MAX_SCORE:
            self.score = self.MAX_SCORE

        if self.score < self.MIN_SCORE:
            self.score = self.MIN_SCORE

    # Get final trust score
    def get_score(self) -> int:
        return self.score

# Policy Engine
class PolicyEngine:

    def __init__(self):

        self.policies = {
            "full_access": 90,
            "warning": 50,
            "restricted": 30
        }

        logging.info("Policy Engine initialized")

    # Evaluate action based on trust score
    def evaluate_policy(self, trust_score: int):

        try:

            if trust_score >= self.policies["full_access"]:

                decision = {
                    "action": "ALLOW",
                    "level": "FULL_ACCESS",
                    "message": "User behavior normal. Full access granted."
                }

            elif trust_score >= self.policies["warning"]:

                decision = {
                    "action": "WARN",
                    "level": "MONITOR",
                    "message": "Suspicious activity detected. Monitoring user."
                }

            elif trust_score >= self.policies["restricted"]:

                decision = {
                    "action": "RESTRICT",
                    "level": "LIMITED_FEATURES",
                    "message": "Access restricted due to abnormal behavior."
                }

            else:

                decision = {
                    "action": "SUSPEND",
                    "level": "LICENSE_BLOCKED",
                    "message": "License suspended due to high anomaly risk."
                }

            logging.info(
                f"Policy decision generated | Score: {trust_score} | Action: {decision['action']}"
            )

            return decision

        except Exception as e:

            logging.error(f"Policy evaluation failed: {str(e)}")

            return {
                "action": "ERROR",
                "level": "SYSTEM_ERROR",
                "message": "Policy engine failure"
            }