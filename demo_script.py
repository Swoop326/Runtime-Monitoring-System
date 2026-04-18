#!/usr/bin/env python3
"""
Demo Automation Script for Adaptive License Validation System
This script automates common demo scenarios to showcase system capabilities.
"""

import requests
import time
import json
import threading
from datetime import datetime

BASE_URL = "http://localhost:8000"
DEMO_DEVICE_ID = "demo-device-123"
DEMO_LICENSE_KEY = None

def log(message, level="INFO"):
    """Simple logging function"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def api_call(endpoint, method="GET", data=None):
    """Make API call with error handling"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url, params=data)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)

        if response.status_code in [200, 201]:
            return response.json()
        else:
            log(f"API call failed: {response.status_code} - {response.text}", "ERROR")
            return None
    except Exception as e:
        log(f"API call error: {e}", "ERROR")
        return None

def setup_demo():
    """Initialize demo environment"""
    log("Setting up demo environment...")

    # Enable demo mode
    result = api_call("/demo-mode?demo=true")
    if result:
        log("Demo mode enabled")

    # Generate license
    result = api_call("/generate-license", "POST")
    if result and "license_key" in result:
        global DEMO_LICENSE_KEY
        DEMO_LICENSE_KEY = result["license_key"]
        log(f"Generated license: {DEMO_LICENSE_KEY}")
    else:
        log("Failed to generate license", "ERROR")
        return False

    # Activate license
    result = api_call("/activate-license", "POST", {
        "license_key": DEMO_LICENSE_KEY,
        "device_id": DEMO_DEVICE_ID
    })
    if result and result.get("status") == "success":
        log("License activated successfully")
        return True
    else:
        log("Failed to activate license", "ERROR")
        return False

def simulate_normal_behavior():
    """Simulate normal user behavior"""
    log("Simulating normal user behavior...")

    for i in range(5):
        # Log normal events
        result = api_call("/log-event", "POST", {
            "license_key": DEMO_LICENSE_KEY,
            "event_type": "button_click",
            "device_id": DEMO_DEVICE_ID
        })
        time.sleep(2)  # Normal pace

    log("Normal behavior simulation complete")

def simulate_anomalous_behavior():
    """Simulate suspicious behavior to trigger anomaly detection"""
    log("Simulating anomalous behavior (rapid clicking)...")

    for i in range(15):
        # Rapid fire events to trigger anomaly
        result = api_call("/log-event", "POST", {
            "license_key": DEMO_LICENSE_KEY,
            "event_type": "button_click",
            "device_id": DEMO_DEVICE_ID
        })
        time.sleep(0.1)  # Very rapid

    log("Anomalous behavior simulation complete")

def check_system_status():
    """Check and display system status"""
    log("Checking system status...")

    result = api_call("/system-health")
    if result:
        print("\n" + "="*50)
        print("SYSTEM HEALTH STATUS")
        print("="*50)
        print(f"Status: {result.get('status', 'UNKNOWN')}")
        print(f"Demo Mode: {result.get('demo_mode', False)}")
        print(f"Active Sessions: {result.get('metrics', {}).get('active_sessions', 0)}")
        print(f"Total Users: {result.get('metrics', {}).get('total_users', 0)}")

        components = result.get('components', {})
        print("\nComponents:")
        for comp, status in components.items():
            print(f"  {comp}: {status}")
        print("="*50 + "\n")

def check_trust_score():
    """Check current trust score"""
    result = api_call("/get-trust-score", "GET", {"license_key": DEMO_LICENSE_KEY})
    if result:
        score = result.get('trust_score', 0)
        policy = result.get('policy', 'UNKNOWN')
        log(f"Current Trust Score: {score}, Policy: {policy}")
        return score, policy
    return 0, "UNKNOWN"

def demo_scenario_1():
    """Complete demo scenario: Normal → Anomaly → Recovery"""
    log("Starting Demo Scenario 1: Complete Behavior Cycle")

    if not setup_demo():
        return

    # Phase 1: Normal behavior
    log("\n--- PHASE 1: NORMAL BEHAVIOR ---")
    simulate_normal_behavior()
    score, policy = check_trust_score()
    check_system_status()

    # Phase 2: Anomalous behavior
    log("\n--- PHASE 2: ANOMALOUS BEHAVIOR ---")
    simulate_anomalous_behavior()
    score, policy = check_trust_score()
    check_system_status()

    # Phase 3: Recovery (admin intervention)
    log("\n--- PHASE 3: ADMIN RECOVERY ---")
    result = api_call("/update-trust-score", "POST", {
        "license_key": DEMO_LICENSE_KEY,
        "trust_score": 100
    })
    if result:
        log("Trust score reset by admin")
    score, policy = check_trust_score()
    check_system_status()

    log("Demo Scenario 1 Complete!")

def demo_scenario_2():
    """Quick anomaly demonstration"""
    log("Starting Demo Scenario 2: Quick Anomaly Demo")

    if not setup_demo():
        return

    log("Initial state:")
    check_trust_score()

    log("Triggering anomaly...")
    simulate_anomalous_behavior()

    log("Post-anomaly state:")
    check_trust_score()
    check_system_status()

def run_continuous_demo():
    """Run continuous demo with periodic status updates"""
    log("Starting continuous demo mode...")

    if not setup_demo():
        return

    def status_thread():
        while True:
            check_system_status()
            time.sleep(10)  # Update every 10 seconds

    # Start status monitoring in background
    threading.Thread(target=status_thread, daemon=True).start()

    log("Continuous demo running. Press Ctrl+C to stop.")
    try:
        while True:
            # Simulate occasional normal activity
            result = api_call("/log-event", "POST", {
                "license_key": DEMO_LICENSE_KEY,
                "event_type": "button_click",
                "device_id": DEMO_DEVICE_ID
            })
            time.sleep(5)
    except KeyboardInterrupt:
        log("Continuous demo stopped.")

def main():
    print("🚀 Adaptive License Validation System - Demo Script")
    print("="*55)

    scenarios = {
        "1": ("Complete Behavior Cycle", demo_scenario_1),
        "2": ("Quick Anomaly Demo", demo_scenario_2),
        "3": ("Continuous Demo", run_continuous_demo),
        "4": ("System Health Check", check_system_status),
        "5": ("Setup Demo Environment", setup_demo)
    }

    while True:
        print("\nAvailable Demo Scenarios:")
        for key, (desc, _) in scenarios.items():
            print(f"  {key}. {desc}")

        choice = input("\nSelect scenario (1-5) or 'q' to quit: ").strip()

        if choice.lower() == 'q':
            break
        elif choice in scenarios:
            desc, func = scenarios[choice]
            print(f"\nRunning: {desc}")
            print("-" * 40)
            try:
                func()
            except Exception as e:
                log(f"Demo scenario failed: {e}", "ERROR")
        else:
            print("Invalid choice. Please select 1-5 or 'q'.")

    log("Demo script exited.")

if __name__ == "__main__":
    main()