import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";

function Dashboard() {

  const navigate = useNavigate();
  const [securityData, setSecurityData] = useState(null);
  const [prevScore, setPrevScore] = useState(null);

  const checkAccess = async () => {
  try {

    const res = await fetch(
      `${API_BASE_URL}/trust-scores?device_id=${getDeviceId()}&license_key=${localStorage.getItem("licenseKey")}`
    );

    const data = await res.json();

    // 🚫 INVALID LICENSE
    if (data.policy === "INVALID LICENSE") {
      alert("Invalid License");

      localStorage.clear();
      navigate("/license");
      return;
    }

    // ⚠️ DETECT MULTI DEVICE
    if (prevScore !== null && data.trust_score < prevScore) {
      alert("⚠️ Another device detected using your license!");
    }

    // 🚫 BLOCK IF TOO LOW
    if (data.trust_score < 30) {
      alert("🚫 Access blocked due to suspicious activity");

      localStorage.clear();
      navigate("/license");
      return;
    }

    setPrevScore(data.trust_score);
    setSecurityData(data);

  } catch (error) {
    console.error("Error checking access:", error);
  }
};

  useEffect(() => {

    fetch(`${API_BASE_URL}/start-session`, {
      method: "POST"
    });

    checkAccess();

    // 🔥 REAL-TIME CHECK
    const interval = setInterval(checkAccess, 1500);

    return () => {
      clearInterval(interval);

      fetch(`${API_BASE_URL}/end-session`, {
        method: "POST"
      });
    };

  }, []);

  // ✅ FIXED HERE (license_key added)
  const sendEvent = async (eventName) => {

    try {

      await fetch(`${API_BASE_URL}/log-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: eventName,
          license_key: localStorage.getItem("licenseKey"), // 🔥 IMPORTANT
          device_id: getDeviceId()
        })
      });

      checkAccess();

    } catch (error) {
      console.error("Error sending event:", error);
    }

  };

  const handleLogout = async () => {

    await fetch(`${API_BASE_URL}/end-session`, { method: "POST" });

    const deviceId = localStorage.getItem("device_id");

    localStorage.clear();

    // ✅ restore device id ALWAYS
    if (deviceId) {
      localStorage.setItem("device_id", deviceId);
    }

    navigate("/");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <div style={{ width: "220px", backgroundColor: "#1e293b", color: "white", padding: "20px" }}>
        <h2>AdaptiveDesk</h2>

        <Link to="/dashboard" style={{ marginTop: "20px", display: "block", color: "white" }}>Dashboard</Link>
        <Link to="/profile" style={{ marginTop: "20px", display: "block", color: "white" }}>Profile</Link>

        <button onClick={handleLogout} style={{ marginTop: "20px" }}>Logout</button>
      </div>

      <div style={{ flex: 1, padding: "40px" }}>

        <h1>Software Dashboard</h1>

        {securityData && (
          <div>
            <p><b>Trust Score:</b> {securityData.trust_score}</p>
            <p><b>Policy:</b> {securityData.policy}</p>
            <p><b>Device ID:</b> {getDeviceId()}</p>
          </div>
        )}

        <button onClick={() => sendEvent("file_upload")}>Upload</button>
        <button onClick={() => sendEvent("data_export")}>Export</button>
        <button onClick={() => sendEvent("report_generated")}>Report</button>

      </div>

    </div>
  );
}

export default Dashboard;