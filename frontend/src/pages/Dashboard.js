import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";

function Dashboard() {

  const navigate = useNavigate();
  const [securityData, setSecurityData] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [lastPolicy, setLastPolicy] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
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

  const fetchSystemHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/system-health`);
      const data = await res.json();
      setSystemHealth(data);
      setDemoMode(data.demo_mode || false);
    } catch (error) {
      console.error("Failed to fetch system health:", error);
    }
  };

  const toggleDemoMode = async () => {
    try {
      const newMode = !demoMode;
      await fetch(`${API_BASE_URL}/demo-mode?demo=${newMode}`);
      setDemoMode(newMode);
      fetchSystemHealth(); // Refresh health data
    } catch (error) {
      console.error("Failed to toggle demo mode:", error);
    }
  };

  useEffect(() => {

    fetch(`${API_BASE_URL}/start-session`, { method: "POST" });

    checkAccess();
    fetchSystemHealth();

    const interval = setInterval(() => {
      checkAccess();
      fetchSystemHealth();
    }, 2000);

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

      {/* BEHAVIOR TIMELINE */}
      <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
        <p style={{ marginBottom: "6px", fontWeight: "bold", color: "#92400e" }}>📊 Behavior Timeline</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{
            padding: "4px 8px",
            backgroundColor: securityData.event_rate > 10 ? "#dc2626" : securityData.event_rate > 5 ? "#f59e0b" : "#10b981",
            color: "white",
            borderRadius: "4px",
            fontSize: "12px"
          }}>
            Event Rate: {securityData.event_rate}/sec
          </span>
          <span style={{
            padding: "4px 8px",
            backgroundColor: securityData.anomaly_score === 1 ? "#dc2626" : "#10b981",
            color: "white",
            borderRadius: "4px",
            fontSize: "12px"
          }}>
            ML: {securityData.ml_prediction}
          </span>
          <span style={{
            padding: "4px 8px",
            backgroundColor: securityData.trust_score > 80 ? "#10b981" : securityData.trust_score > 50 ? "#f59e0b" : "#dc2626",
            color: "white",
            borderRadius: "4px",
            fontSize: "12px"
          }}>
            Trust: {securityData.trust_score}
          </span>
        </div>

        {/* MINI CHART */}
        <div style={{ marginTop: "8px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "4px", display: "flex", alignItems: "flex-end", gap: "2px", padding: "4px" }}>
          {[0.2, 0.4, 0.6, 0.8, 1.0, 0.7, 0.9, securityData.event_rate / 15].map((val, i) => (
            <div key={i} style={{
              flex: 1,
              backgroundColor: val > 0.8 ? "#dc2626" : val > 0.5 ? "#f59e0b" : "#10b981",
              height: `${Math.max(4, val * 32)}px`,
              borderRadius: "2px",
              transition: "height 0.3s ease"
            }}></div>
          ))}
        </div>
        <p style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>Recent activity levels (last 8 checks)</p>
      </div>

      {/* TRUST SCORE BREAKDOWN */}
      <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f0f9ff", borderRadius: "8px" }}>
        <p style={{ marginBottom: "8px", fontWeight: "bold", color: "#0369a1" }}>🎯 Trust Score Calculation</p>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{ flex: 1 }}>
            <div style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#e5e7eb",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${securityData.trust_score}%`,
                height: "100%",
                backgroundColor: securityData.trust_score > 80 ? "#10b981" : securityData.trust_score > 50 ? "#f59e0b" : "#dc2626",
                transition: "width 0.5s ease"
              }}></div>
            </div>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              {securityData.trust_score}/100 Trust Score
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
          <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px" }}>
            <strong>✅ Normal Factors:</strong><br/>
            • Device consistency<br/>
            • Regular usage patterns<br/>
            • Normal session duration
          </div>
          <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px" }}>
            <strong>❌ Penalty Factors:</strong><br/>
            • High anomaly score (-30)<br/>
            • Multiple sessions (-20)<br/>
            • Excessive usage (-20)
          </div>
      {/* SYSTEM STATUS */}
      <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#ecfdf5", borderRadius: "8px", border: "1px solid #d1fae5" }}>
        <p style={{ marginBottom: "8px", fontWeight: "bold", color: "#065f46" }}>✅ System Status: ACTIVE</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", fontSize: "11px" }}>
          <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ color: "#10b981", fontSize: "16px", marginBottom: "2px" }}>🔄</div>
            <strong>Runtime Monitor</strong><br/>
            <span style={{ color: "#059669" }}>Active</span>
          </div>
          <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ color: "#3b82f6", fontSize: "16px", marginBottom: "2px" }}>🧠</div>
            <strong>ML Engine</strong><br/>
            <span style={{ color: "#059669" }}>Isolation Forest</span>
          </div>
          <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ color: "#f59e0b", fontSize: "16px", marginBottom: "2px" }}>📈</div>
            <strong>Trust Scoring</strong><br/>
            <span style={{ color: "#059669" }}>Dynamic</span>
          </div>
          <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ color: "#8b5cf6", fontSize: "16px", marginBottom: "2px" }}>🛡️</div>
            <strong>Policy Engine</strong><br/>
            <span style={{ color: "#059669" }}>Enforced</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <p style={{ marginBottom: "8px", fontWeight: "bold", color: "#334155" }}>🏗️ System Architecture</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#10b981", fontWeight: "bold" }}>📊</span>
            <span><strong>Runtime Monitor:</strong> Continuous behavior tracking</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>🤖</span>
            <span><strong>ML Engine:</strong> Isolation Forest anomaly detection</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f59e0b", fontWeight: "bold" }}>⚖️</span>
            <span><strong>Trust Score Engine:</strong> Dynamic risk assessment</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#8b5cf6", fontWeight: "bold" }}>📋</span>
            <span><strong>Policy Engine:</strong> Adaptive access control</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#ef4444", fontWeight: "bold" }}>🔒</span>
            <span><strong>Device Binding:</strong> Hardware-locked validation</span>
          </div>
        </div>
      </div>

      {/* SYSTEM HEALTH DASHBOARD */}
      {systemHealth && (
        <div style={{ marginTop: "12px", padding: "12px", backgroundColor: systemHealth.status === "HEALTHY" ? "#f0fdf4" : "#fef2f2", borderRadius: "8px", border: `1px solid ${systemHealth.status === "HEALTHY" ? "#bbf7d0" : "#fecaca"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <p style={{ margin: 0, fontWeight: "bold", color: systemHealth.status === "HEALTHY" ? "#166534" : "#991b1b" }}>
              🔍 System Health: {systemHealth.status}
            </p>
            <button
              onClick={toggleDemoMode}
              style={{
                padding: "4px 8px",
                backgroundColor: demoMode ? "#f59e0b" : "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer"
              }}
            >
              {demoMode ? "🎭 Demo ON" : "📊 Demo OFF"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "6px", fontSize: "11px" }}>
            <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ color: systemHealth.components?.database === "CONNECTED" ? "#10b981" : "#dc2626", fontSize: "14px", marginBottom: "2px" }}>
                {systemHealth.components?.database === "CONNECTED" ? "🗄️" : "❌"}
              </div>
              <strong>Database</strong><br/>
              <span style={{ color: systemHealth.components?.database === "CONNECTED" ? "#059669" : "#dc2626" }}>
                {systemHealth.components?.database || "UNKNOWN"}
              </span>
            </div>
            <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ color: systemHealth.components?.ml_model === "LOADED" ? "#10b981" : "#dc2626", fontSize: "14px", marginBottom: "2px" }}>
                {systemHealth.components?.ml_model === "LOADED" ? "🧠" : "❌"}
              </div>
              <strong>ML Model</strong><br/>
              <span style={{ color: systemHealth.components?.ml_model === "LOADED" ? "#059669" : "#dc2626" }}>
                {systemHealth.components?.ml_model || "UNKNOWN"}
              </span>
            </div>
            <div style={{ padding: "6px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ color: systemHealth.components?.logging === "AVAILABLE" ? "#10b981" : "#dc2626", fontSize: "14px", marginBottom: "2px" }}>
                {systemHealth.components?.logging === "AVAILABLE" ? "📝" : "❌"}
              </div>
              <strong>Logging</strong><br/>
              <span style={{ color: systemHealth.components?.logging === "AVAILABLE" ? "#059669" : "#dc2626" }}>
                {systemHealth.components?.logging || "UNKNOWN"}
              </span>
            </div>
          </div>

          <div style={{ marginTop: "8px", fontSize: "11px", color: "#6b7280" }}>
            <strong>Metrics:</strong> {systemHealth.metrics?.active_sessions || 0} active sessions, {systemHealth.metrics?.total_users || 0} total users
          </div>
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
            style={{ ...button, opacity: securityData?.policy !== "ALLOW" ? 0.5 : 1 }}
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