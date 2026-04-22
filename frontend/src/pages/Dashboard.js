import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";

function Dashboard() {

  const navigate = useNavigate();
  const [securityData, setSecurityData] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [lastPolicy, setLastPolicy] = useState(null);
  const [geoLocation, setGeoLocation] = useState(null);
  const [geoError, setGeoError] = useState("");
  const lastPolicyRef = useRef(null);
  const lastNotificationRef = useRef({ key: "", time: 0 });
  const geoWatchRef = useRef(null);
  const geoLocationRef = useRef(null);

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

  const notifyWithCooldown = (key, message, cooldownMs = 30000) => {
    const now = Date.now();
    const last = lastNotificationRef.current;

    if (last.key === key && now - last.time < cooldownMs) {
      return;
    }

    lastNotificationRef.current = { key, time: now };
    alert(message);
  };

  const checkAccess = async () => {
    try {

      const activeGeoLocation = geoLocationRef.current;
      const geoQuery = activeGeoLocation
        ? `&latitude=${encodeURIComponent(activeGeoLocation.latitude)}&longitude=${encodeURIComponent(activeGeoLocation.longitude)}&accuracy=${encodeURIComponent(activeGeoLocation.accuracy)}`
        : "";

      const res = await fetch(
        `${API_BASE_URL}/trust-scores?device_id=${getDeviceId()}&license_key=${localStorage.getItem("licenseKey")}${geoQuery}`
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

      // Only notify when trust crosses into risky zone instead of every minor drop.
      if (prevScore !== null && prevScore > 50 && data.trust_score <= 50) {
        notifyWithCooldown(
          "trust-risk",
          "⚠️ Trust score dropped to a risky level. Please verify your activity.",
          45000
        );
      }

      if (currentPolicy !== previousPolicy) {
        if (currentPolicy === "SUSPEND") {
          notifyWithCooldown(
            "policy-suspend",
            "🚫 Your license has been suspended due to abnormal behavior. Actions are blocked until review.",
            45000
          );
        } else if (currentPolicy === "RESTRICT") {
          notifyWithCooldown(
            "policy-restrict",
            "⚠️ Restricted mode: some actions are disabled due to suspicious behavior.",
            30000
          );
        } else if (currentPolicy === "WARN") {
          notifyWithCooldown(
            "policy-warn",
            "⚠️ Suspicious activity detected. Monitoring your session.",
            30000
          );
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

    if (navigator.geolocation) {
      geoWatchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const nextGeoLocation = {
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: Number(position.coords.accuracy.toFixed(2))
          };

          geoLocationRef.current = nextGeoLocation;
          setGeoLocation(nextGeoLocation);
          setGeoError("");
        },
        (error) => {
          setGeoError(error.message || "Location access denied");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000
        }
      );
    } else {
      setGeoError("Geolocation is not supported in this browser");
    }

    checkAccess();

    const interval = setInterval(() => {
      checkAccess();
    }, 2000);

    return () => {
      clearInterval(interval);
      if (geoWatchRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
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
        device_id: getDeviceId(),
        geo_location: geoLocation
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

        <div style={{ padding: "20px" }}>
          <h1>Software Dashboard</h1>

          {/* MAIN DASHBOARD GRID */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "20px",
            marginTop: "20px"
          }}>

            {/* LEFT COLUMN - TRUST & SECURITY INFO */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* TRUST CARD */}
              {securityData && (
                <div style={{
                  padding: "20px",
                  border: "1px solid #ccc",
                  borderRadius: "12px",
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  <div style={{
                    marginBottom: "15px",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor:
                      securityData.policy === "ALLOW" ? "#d1fae5" :
                      securityData.policy === "WARN" ? "#fef3c7" :
                      securityData.policy === "RESTRICT" ? "#fee2e2" : "#f5f3ff",
                    color:
                      securityData.policy === "ALLOW" ? "#065f46" :
                      securityData.policy === "WARN" ? "#92400e" :
                      securityData.policy === "RESTRICT" ? "#991b1b" : "#4c1d95",
                    fontWeight: "bold",
                    textAlign: "center"
                  }}>
                    Behavior Status: {securityData.policy}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "14px" }}>
                    <div>
                      <strong>Trust Score:</strong> {securityData.trust_score}/100
                    </div>
                    <div>
                      <strong>ML Prediction:</strong>{" "}
                      <span style={{
                        color: securityData.ml_prediction === "anomaly" ? "red" : "green",
                        fontWeight: "bold"
                      }}>
                        {securityData.ml_prediction?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <strong>Anomaly Score:</strong> {securityData.anomaly_score}
                    </div>
                    <div>
                      <strong>Event Rate:</strong>{" "}
                      <span style={{
                        color: securityData.event_rate > 15 ? "red" : "green"
                      }}>
                        {securityData.event_rate}/sec
                      </span>
                    </div>
                  </div>

                  {/* ML Input Features - Compact */}
                  <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", fontSize: "12px" }}>
                    <p style={{ marginBottom: "8px", fontWeight: "bold", margin: "0 0 8px 0" }}>ML Features</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                      <span>Duration: {securityData.feature_inputs?.session_duration_minutes}m</span>
                      <span>Active: {securityData.feature_inputs?.active_sessions}</span>
                      <span>Devices: {securityData.feature_inputs?.unique_devices_used}</span>
                      <span>Frequency: {securityData.feature_inputs?.login_frequency_per_day}/day</span>
                      <span>
                        Location: {geoLocation ? `${geoLocation.latitude.toFixed(4)}, ${geoLocation.longitude.toFixed(4)}` : "waiting..."}
                      </span>
                    </div>
                    {geoError && (
                      <div style={{ gridColumn: "1 / -1", color: "#b45309", marginTop: "4px" }}>
                        Location: {geoError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TRUST SCORE BREAKDOWN */}
              {securityData && (
                <div style={{ padding: "20px", backgroundColor: "#f0f9ff", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                  <p style={{ marginBottom: "15px", fontWeight: "bold", color: "#0369a1", margin: "0 0 15px 0" }}>🎯 Trust Score</p>

                  <div style={{ marginBottom: "15px" }}>
                    <div style={{
                      width: "100%",
                      height: "10px",
                      backgroundColor: "#e5e7eb",
                      borderRadius: "5px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${securityData.trust_score}%`,
                        height: "100%",
                        backgroundColor: securityData.trust_score > 80 ? "#10b981" : securityData.trust_score > 50 ? "#f59e0b" : "#dc2626",
                        transition: "width 0.5s ease"
                      }}></div>
                    </div>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "5px 0 0 0" }}>
                      {securityData.trust_score}/100
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                    <div style={{ padding: "8px", backgroundColor: "white", borderRadius: "6px" }}>
                      <strong>✅ Normal:</strong><br/>
                      • Device consistency<br/>
                      • Regular patterns
                    </div>
                    <div style={{ padding: "8px", backgroundColor: "white", borderRadius: "6px" }}>
                      <strong>❌ Penalties:</strong><br/>
                      • High anomaly (-20)<br/>
                      • Multiple sessions (-20)
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN - BEHAVIOR & SYSTEM INFO */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* BEHAVIOR TIMELINE */}
              {securityData && (
                <div style={{ padding: "20px", backgroundColor: "#fef3c7", borderRadius: "12px", border: "1px solid #fde68a" }}>
                  <p style={{ marginBottom: "15px", fontWeight: "bold", color: "#92400e", margin: "0 0 15px 0" }}>📊 Behavior Timeline</p>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "15px" }}>
                    <span style={{
                      padding: "6px 12px",
                      backgroundColor: securityData.event_rate > 10 ? "#dc2626" : securityData.event_rate > 5 ? "#f59e0b" : "#10b981",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      Event Rate: {securityData.event_rate}/sec
                    </span>
                    <span style={{
                      padding: "6px 12px",
                      backgroundColor: securityData.anomaly_score === 1 ? "#dc2626" : "#10b981",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      ML: {securityData.ml_prediction}
                    </span>
                    <span style={{
                      padding: "6px 12px",
                      backgroundColor: securityData.trust_score > 80 ? "#10b981" : securityData.trust_score > 50 ? "#f59e0b" : "#dc2626",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      Trust: {securityData.trust_score}
                    </span>
                  </div>

                  {/* MINI CHART */}
                  <div style={{ height: "50px", backgroundColor: "#f3f4f6", borderRadius: "6px", display: "flex", alignItems: "flex-end", gap: "2px", padding: "6px" }}>
                    {[0.2, 0.4, 0.6, 0.8, 1.0, 0.7, 0.9, securityData.event_rate / 15].map((val, i) => (
                      <div key={i} style={{
                        flex: 1,
                        backgroundColor: val > 0.8 ? "#dc2626" : val > 0.5 ? "#f59e0b" : "#10b981",
                        height: `${Math.max(6, val * 38)}px`,
                        borderRadius: "3px",
                        transition: "height 0.3s ease"
                      }}></div>
                    ))}
                  </div>
                  <p style={{ fontSize: "10px", color: "#6b7280", margin: "8px 0 0 0", textAlign: "center" }}>Recent activity levels</p>
                </div>
              )}

              {/* SYSTEM STATUS & ARCHITECTURE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>

                {/* SYSTEM STATUS */}
                <div style={{ padding: "15px", backgroundColor: "#ecfdf5", borderRadius: "12px", border: "1px solid #d1fae5" }}>
                  <p style={{ marginBottom: "12px", fontWeight: "bold", color: "#065f46", fontSize: "14px", margin: "0 0 12px 0" }}>✅ System Status</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", fontSize: "11px" }}>
                    <div style={{ padding: "8px", backgroundColor: "white", borderRadius: "6px", textAlign: "center" }}>
                      <div style={{ color: "#10b981", fontSize: "16px", marginBottom: "4px" }}>🔄</div>
                      <strong>Runtime Monitor</strong><br/>
                      <span style={{ color: "#059669" }}>Active</span>
                    </div>
                    <div style={{ padding: "8px", backgroundColor: "white", borderRadius: "6px", textAlign: "center" }}>
                      <div style={{ color: "#3b82f6", fontSize: "16px", marginBottom: "4px" }}>🧠</div>
                      <strong>ML Engine</strong><br/>
                      <span style={{ color: "#059669" }}>Isolation Forest</span>
                    </div>
                  </div>
                </div>

                {/* SYSTEM ARCHITECTURE */}
                <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <p style={{ marginBottom: "12px", fontWeight: "bold", color: "#334155", fontSize: "14px", margin: "0 0 12px 0" }}>🏗️ Architecture</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#f59e0b", fontWeight: "bold" }}>⚖️</span>
                      <span><strong>Trust Engine</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#8b5cf6", fontWeight: "bold" }}>📋</span>
                      <span><strong>Policy Engine</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#ef4444", fontWeight: "bold" }}>🔒</span>
                      <span><strong>Device Binding</strong></span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* ACTION BUTTONS - HORIZONTAL LAYOUT */}
          <div style={{
            marginTop: "30px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            maxWidth: "800px"
          }}>

            <button
              style={{
                ...button,
                opacity: securityData?.policy === "SUSPEND" ? 0.5 : 1,
                margin: 0
              }}
              onClick={() => sendEvent("file_upload")}
              disabled={securityData?.policy === "SUSPEND"}
            >
              📁 Upload File
            </button>

            <button
              style={{
                ...button,
                opacity: securityData?.policy !== "ALLOW" ? 0.5 : 1,
                margin: 0
              }}
              onClick={() => sendEvent("data_export")}
              disabled={securityData?.policy !== "ALLOW"}
            >
              📊 Export Data
            </button>

            <button
              style={{
                ...button,
                opacity: securityData?.policy === "SUSPEND" ? 0.5 : 1,
                margin: 0
              }}
              onClick={() => sendEvent("report_generated")}
              disabled={securityData?.policy === "SUSPEND"}
            >
              📋 Generate Report
            </button>

          </div>
      </div>

      </div>

    </div>
  );
}

export default Dashboard;