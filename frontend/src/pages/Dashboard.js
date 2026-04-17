import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";

function Dashboard() {

  const navigate = useNavigate();
  const [securityData, setSecurityData] = useState(null);
  const [prevScore, setPrevScore] = useState(null);

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

      if (prevScore !== null && data.trust_score < prevScore) {
        alert("⚠️ Another device detected using your license!");
      }

      if (data.trust_score < 30) {
        alert("🚫 Access blocked due to suspicious activity");
        localStorage.clear();
        navigate("/license");
        return;
      }

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

      <h3>ML Security Analysis</h3>

      <p><b>Trust Score:</b> {securityData.trust_score}</p>
      <p><b>Policy:</b> {securityData.policy}</p>

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

      <p style={{ marginTop: "10px", fontSize: "14px", color: "gray" }}>
        ML Model → Detects anomaly → Updates trust score → Applies policy
      </p>

    </div>
  )}

        {/* ACTION BUTTONS */}
        <div style={{ marginTop: "30px", width: "300px" }}>

          <button style={button} onClick={() => sendEvent("file_upload")}>
            Upload File
          </button>

          <button style={button} onClick={() => sendEvent("data_export")}>
            Export Data
          </button>

          <button style={button} onClick={() => sendEvent("report_generated")}>
            Generate Report
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;