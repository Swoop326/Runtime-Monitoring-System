import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

function Dashboard() {

  const navigate = useNavigate();
  const [securityData, setSecurityData] = useState(null);

  const loadSecurityStatus = async () => {

    try {

      const res = await fetch(`${API_BASE_URL}/trust-scores`);
      const data = await res.json();

      setSecurityData(data);

    } catch (error) {

      console.error("Error loading security status:", error);

    }

  };

  // Start monitoring when dashboard opens
  useEffect(() => {

    fetch(`${API_BASE_URL}/start-session`, {
      method: "POST"
    });

    loadSecurityStatus();

    // Stop monitoring if page closes
    return () => {
      fetch(`${API_BASE_URL}/end-session`, {
        method: "POST"
      });
    };

  }, []);

  const sendEvent = async (eventName) => {

    try {

      await fetch(`${API_BASE_URL}/log-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: eventName
        })
      });

      console.log("Event sent:", eventName);

      // refresh trust score after event
      loadSecurityStatus();

    } catch (error) {
      console.error("Error sending event:", error);
    }

  };

  const handleLogout = async () => {

    try {

      await fetch(`${API_BASE_URL}/end-session`, {
        method: "POST"
      });

    } catch (error) {
      console.error("Error ending session:", error);
    }

    localStorage.clear();
    navigate("/");

  };

  const container = { display: "flex", height: "100vh" };
  const sidebar = { width: "220px", backgroundColor: "#1e293b", color: "white", padding: "20px" };
  const menuItem = { marginTop: "20px", cursor: "pointer", display: "block", color: "white", textDecoration: "none", background: "none", border: "none" };
  const main = { flex: 1, padding: "40px", backgroundColor: "#f5f7fb" };
  const card = { background: "white", padding: "25px", borderRadius: "10px", width: "250px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)", textAlign: "center" };
  const cardContainer = { display: "flex", gap: "20px", marginTop: "30px" };

  const securityCard = {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px",
    width: "300px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
  };

  return (
    <div style={container}>

      <div style={sidebar}>
        <h2>AdaptiveDesk</h2>

        <Link to="/dashboard" style={menuItem}>Dashboard</Link>
        <Link to="/dashboard" style={menuItem}>Files</Link>
        <Link to="/dashboard" style={menuItem}>Reports</Link>
        <Link to="/profile" style={menuItem}>Profile</Link>

        <button onClick={handleLogout} style={menuItem}>
          Logout
        </button>
      </div>

      <div style={main}>

        <h1>Software Dashboard</h1>
        <p>Welcome to AdaptiveDesk Licensed Software</p>

        {/* Security Status Widget */}

        {securityData && (
          <div style={securityCard}>
            <h3>Security Status</h3>

            <p><b>Trust Score:</b> {securityData.trust_score}</p>
            <p><b>Policy:</b> {securityData.policy}</p>
            <p><b>Events Detected:</b> {securityData.events_detected}</p>
            <p><b>Device ID:</b> {securityData.device_id}</p>
          </div>
        )}

        <div style={cardContainer}>

          <div style={card}>
            <h3>Upload File</h3>
            <button onClick={() => sendEvent("file_upload")}>
              Upload
            </button>
          </div>

          <div style={card}>
            <h3>Export Data</h3>
            <button onClick={() => sendEvent("data_export")}>
              Export
            </button>
          </div>

          <div style={card}>
            <h3>Generate Report</h3>
            <button onClick={() => sendEvent("report_generated")}>
              Generate
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;