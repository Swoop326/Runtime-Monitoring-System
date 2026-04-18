import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";

function Dashboard() {

  const navigate = useNavigate();
  const [securityData, setSecurityData] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [lastPolicy, setLastPolicy] = useState(null);
  const lastPolicyRef = useRef(null);

  const container = {
    display: "flex",
    height: "100vh"
  };

  const sidebar = {
    width: "220px",
    backgroundColor: "#1e293b",
    color: "white",
    padding: "20px"
  };

  const main = {
    flex: 1,
    padding: "40px",
    backgroundColor: "#f5f7fb"
  };

  const card = {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    width: "300px"
  };

  const button = {
    padding: "10px",
    marginTop: "10px",
    width: "100%",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer"
  };

  const checkAccess = async () => {
    try {

      const res = await fetch(
        `${API_BASE_URL}/trust-scores?device_id=${getDeviceId()}&license_key=${localStorage.getItem("licenseKey")}`
      );

      const data = await res.json();

      if (data.policy === "INVALID LICENSE") {
        alert("Invalid License");
        localStorage.clear();
        navigate("/license");
        return;
      }

      const currentPolicy = data.policy;
      const previousPolicy = lastPolicyRef.current;

      if (prevScore !== null && data.trust_score < prevScore) {
        alert("⚠️ Another device detected using your license!");
      }

      if (currentPolicy !== previousPolicy) {
        if (currentPolicy === "SUSPEND") {
          alert("🚫 Your license has been suspended due to abnormal behavior. Actions are blocked until review.");
        } else if (currentPolicy === "RESTRICT") {
          alert("⚠️ Restricted mode: some actions are disabled due to suspicious behavior.");
        } else if (currentPolicy === "WARN") {
          alert("⚠️ Suspicious activity detected. Monitoring your session.");
        }
      }

      lastPolicyRef.current = currentPolicy;
      setLastPolicy(currentPolicy);

      setPrevScore(data.trust_score);
      setSecurityData(data);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {

    fetch(`${API_BASE_URL}/start-session`, { method: "POST" });

    checkAccess();

    const interval = setInterval(checkAccess, 2000);

    return () => {
      clearInterval(interval);
      fetch(`${API_BASE_URL}/end-session`, { method: "POST" });
    };

  }, []);

  const sendEvent = async (eventName) => {

    if (securityData?.policy === "SUSPEND") {
      alert("🚫 Action blocked: user behavior is suspended.");
      return;
    }

    if (securityData?.policy === "RESTRICT") {
      alert("⚠️ Restricted mode: some actions are disabled due to suspicious behavior.");
      return;
    }

    await fetch(`${API_BASE_URL}/log-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event: eventName,
        license_key: localStorage.getItem("licenseKey"),
        device_id: getDeviceId()
      })
    });

    checkAccess();
  };

  const handleLogout = async () => {

    await fetch(`${API_BASE_URL}/end-session`, { method: "POST" });

    const deviceId = localStorage.getItem("device_id");

    localStorage.clear();

    if (deviceId) {
      localStorage.setItem("device_id", deviceId);
    }

    navigate("/");
  };

  return (
    <div style={container}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2>AdaptiveDesk</h2>

        <p style={{ marginTop: "20px" }}>Dashboard</p>

        <button onClick={handleLogout} style={{ marginTop: "20px" }}>
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={main}>

        <h1>Software Dashboard</h1>

        {/* TRUST CARD */}
        {securityData && (
          <div style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            width: "350px"
          }}>
            <div style={{
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor:
                securityData.policy === "ALLOW" ? "#d1fae5" :
                securityData.policy === "WARN" ? "#fef3c7" :
                securityData.policy === "RESTRICT" ? "#fee2e2" : "#f5f3ff",
              color:
                securityData.policy === "ALLOW" ? "#065f46" :
                securityData.policy === "WARN" ? "#92400e" :
                securityData.policy === "RESTRICT" ? "#991b1b" : "#4c1d95"
            }}>
              <strong>Behavior Status:</strong> {securityData.policy}
            </div>

      <h3>ML Security Analysis</h3>

      <p><b>Trust Score:</b> {securityData.trust_score}</p>
      <p><b>Policy:</b> {securityData.policy}</p>
      <p><b>ML Model:</b> {securityData.model_name || "IsolationForest"}</p>
      <p><b>Last Inference:</b> {securityData.last_ml_inference}</p>

      <p>
        <b>ML Prediction:</b>{" "}
        <span style={{
          color: securityData.ml_prediction === "anomaly" ? "red" : "green",
          fontWeight: "bold"
        }}>
          {securityData.ml_prediction?.toUpperCase()}
        </span>
      </p>

      <p><b>Anomaly Score:</b> {securityData.anomaly_score}</p>

      <p>
        <b>Event Rate:</b>{" "}
        <span style={{
          color: securityData.event_rate > 15 ? "red" : "green"
        }}>
          {securityData.event_rate} events/sec
        </span>
      </p>

      <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
        <p style={{ marginBottom: "6px", fontWeight: "bold" }}>ML Input Features</p>
        <p>Session duration: {securityData.feature_inputs?.session_duration_minutes} min</p>
        <p>Active sessions: {securityData.feature_inputs?.active_sessions}</p>
        <p>Unique devices: {securityData.feature_inputs?.unique_devices_used}</p>
        <p>Login frequency: {securityData.feature_inputs?.login_frequency_per_day} per day</p>
        <p>ML anomaly input: {securityData.feature_inputs?.anomaly_score}</p>
        <p>Stored trust score: {securityData.feature_inputs?.trust_score}</p>
      </div>

      <p style={{ marginTop: "10px", fontSize: "14px", color: "gray" }}>
        ML Model → Detects anomaly → Updates trust score → Applies policy
      </p>

    </div>
  )}

        {/* ACTION BUTTONS */}
        <div style={{ marginTop: "30px", width: "300px" }}>

          <button
            style={{ ...button, opacity: securityData?.policy === "SUSPEND" ? 0.5 : 1 }}
            onClick={() => sendEvent("file_upload")}
            disabled={securityData?.policy === "SUSPEND"}
          >
            Upload File
          </button>

          <button
            style={{ ...button, opacity: securityData?.policy !== "ALLOW" ? 0.7 : 1 }}
            onClick={() => sendEvent("data_export")}
            disabled={securityData?.policy !== "ALLOW"}
          >
            Export Data
          </button>

          <button
            style={{ ...button, opacity: securityData?.policy === "SUSPEND" ? 0.5 : 1 }}
            onClick={() => sendEvent("report_generated")}
            disabled={securityData?.policy === "SUSPEND"}
          >
            Generate Report
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;