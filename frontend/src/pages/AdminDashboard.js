import React, { useState, useEffect } from "react";
import API_BASE_URL from "../config";

function AdminDashboard() {

  const [license, setLicense] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState("");
  const [logs, setLogs] = useState([]);
  const [trustData, setTrustData] = useState(null);

  // Generate license
  const generateLicense = async () => {

    const res = await fetch(`${API_BASE_URL}/generate-license`, {
      method: "POST"
    });

    const data = await res.json();

    setLicense(data.license_key);
    loadLicenses();
  };

  // Load licenses
  const loadLicenses = async () => {

    const res = await fetch(`${API_BASE_URL}/licenses`);
    const data = await res.json();

    setLicenses(data);
  };

  // Load logs for selected license
  const loadLogs = async (licenseKey) => {

    if (!licenseKey) return;

    const res = await fetch(`${API_BASE_URL}/logs?license_key=${licenseKey}`);
    const data = await res.json();

    setLogs(Array.isArray(data) ? data : []);
  };

  // Load trust score for selected license
  const loadTrustScore = async (licenseKey) => {

  const res = await fetch(
    `${API_BASE_URL}/trust-scores?device_id=ADMIN&license_key=${licenseKey}`
  );

  const data = await res.json();
  setTrustData(data);
};

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleSelect = (e) => {

    const selected = e.target.value;
    setSelectedLicense(selected);

    loadLogs(selected);
    loadTrustScore(selected);
  };

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
            <th>Devices Used</th>
          </tr>
        </thead>

        <tbody>
          {licenses.map((l, index) => (
            <tr key={index}>
              <td>{l.license_key}</td>
              <td>{l.active ? "Active" : "Inactive"}</td>
              <td>
                {l.devices_used?.length > 0
                  ? l.devices_used.join(", ")
                  : "Not Used"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SELECT LICENSE */}

      <h2 style={{ marginTop: "40px" }}>Select User License</h2>

      <select onChange={handleSelect} value={selectedLicense}>
        <option value="">-- Select License --</option>
        {licenses.map((l, index) => (
          <option key={index} value={l.license_key}>
            {l.license_key}
          </option>
        ))}
      </select>

      {/* LOGS */}

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
          <p><b>Trust Score:</b> {trustData.trust_score}</p>
          <p><b>Policy:</b> {trustData.policy}</p>
          <p><b>Events:</b> {trustData.events_detected}</p>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;