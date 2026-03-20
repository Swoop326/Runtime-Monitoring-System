import React, { useState, useEffect } from "react";
import API_BASE_URL from "../config";

function AdminDashboard() {

  const [license, setLicense] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [trustData, setTrustData] = useState(null);

  // Generate license
  const generateLicense = async () => {

    const res = await fetch(`${API_BASE_URL}/generate-license`, {
      method: "POST"
    });

    const data = await res.json();

    setLicense(data.license_key);

    loadLicenses(); // refresh license list
  };

  // Load all licenses
  const loadLicenses = async () => {

    const res = await fetch(`${API_BASE_URL}/licenses`);
    const data = await res.json();

    setLicenses(data);
  };

  // Load runtime logs
  const loadLogs = async () => {

    const res = await fetch(`${API_BASE_URL}/logs`);
    const data = await res.json();

    setLogs(data);
  };

  // Load trust score
  const loadTrustScore = async () => {

    const res = await fetch(`${API_BASE_URL}/trust-scores`);
    const data = await res.json();

    setTrustData(data);
  };

  // Run when page loads
  useEffect(() => {
    loadLicenses();
    loadLogs();
    loadTrustScore();
  }, []);

  return (
    <div style={{ padding: "40px" }}>

      <h1>Admin Panel</h1>

      <button onClick={generateLicense}>
        Generate License
      </button>

      {license && (
        <p>
          Generated License: <b>{license}</b>
        </p>
      )}

      {/* LICENSE TABLE */}

      <h2 style={{ marginTop: "40px" }}>Generated Licenses</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>License Key</th>
            <th>Status</th>
            <th>Device</th>
          </tr>
        </thead>

        <tbody>
          {licenses.map((l, index) => (
            <tr key={index}>
              <td>{l.license_key}</td>
              <td>{l.active ? "Active" : "Inactive"}</td>
              <td>{l.device_id || "Not Used"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* RUNTIME LOGS */}

      <h2 style={{ marginTop: "40px" }}>Runtime Logs</h2>

      <ul>
        {logs.map((log, index) => (
          <li key={index}>{log}</li>
        ))}
      </ul>

      {/* TRUST SCORE */}

      <h2 style={{ marginTop: "40px" }}>Trust Score Monitoring</h2>

      {trustData && (
        <div style={{
          border: "1px solid #ccc",
          padding: "15px",
          borderRadius: "8px",
          width: "400px"
        }}>

          <p><b>Device ID:</b> {trustData.device_id}</p>

          <p><b>Trust Score:</b> {trustData.trust_score}</p>

          <p><b>Policy Decision:</b> {trustData.policy}</p>

          <p><b>Runtime Events Detected:</b> {trustData.events_detected}</p>

        </div>
      )}

    </div>
  );
}

export default AdminDashboard;