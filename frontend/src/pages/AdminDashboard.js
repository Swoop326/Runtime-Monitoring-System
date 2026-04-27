import React, { useState, useEffect } from "react";
import API_BASE_URL from "../config";

function AdminDashboard() {

  const [license, setLicense] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState("");
  const [logs, setLogs] = useState([]);
  const [trustData, setTrustData] = useState(null);
  const [trustScoreInput, setTrustScoreInput] = useState("");

  const container = {
    padding: "40px",
    backgroundColor: "#f5f7fb",
    minHeight: "100vh"
  };

  const card = {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
  };

  const button = {
    padding: "10px 15px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  };

  const logBox = {
    maxHeight: "200px",
    overflowY: "scroll",
    background: "#111",
    color: "#0f0",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "12px"
  };

  // Generate license
  const generateLicense = async () => {
    const res = await fetch(`${API_BASE_URL}/generate-license`, { method: "POST" });
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

  // Load logs
  const loadLogs = async (licenseKey) => {
    if (!licenseKey) return;
    const res = await fetch(`${API_BASE_URL}/logs?license_key=${licenseKey}`);
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
  };

  // Load trust score
  const loadTrustScore = async (licenseKey) => {
    if (!licenseKey) return;
    const res = await fetch(
      `${API_BASE_URL}/trust-scores?device_id=ADMIN&license_key=${licenseKey}`
    );
    const data = await res.json();
    setTrustData(data);
    setTrustScoreInput(data.trust_score ?? "");
  };

  const updateTrustScore = async () => {
    if (!selectedLicense) return;

    const res = await fetch(`${API_BASE_URL}/update-trust-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: selectedLicense,
        trust_score: trustScoreInput
      })
    });

    const data = await res.json();

    if (data.success) {
      alert("Trust score updated successfully");
      loadTrustScore(selectedLicense);
      loadLicenses();
    } else {
      alert(`Update failed: ${data.message}`);
    }
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

  const downloadReport = async () => {
    if (!selectedLicense) return;

    const res = await fetch(
      `${API_BASE_URL}/download-report?license_key=${selectedLicense}`
    );

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `behavior_report_${selectedLicense}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={container}>

      <h1>Admin Dashboard</h1>

      {/* GENERATE LICENSE */}
      <div style={card}>
        <button style={button} onClick={generateLicense}>
          Generate License
        </button>

        {license && (
          <p style={{ marginTop: "10px" }}>
            Generated: <b>{license}</b>
          </p>
        )}
      </div>

      {/* LICENSE TABLE */}
      <div style={card}>
        <h3>All Licenses</h3>

        <table border="1" cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
                <th>License Key</th>
                <th>Status</th>
                <th>Devices (last location)</th>
            </tr>
          </thead>

          <tbody>
            {licenses.map((l, index) => (
              <tr key={index}>
                <td>{l.license_key}</td>
                <td style={{ color: l.active ? "green" : "red" }}>
                  {l.active ? "Active" : "Inactive"}
                </td>
                  <td>
                    {l.devices_used?.length > 0 ? (
                      (() => {
                        const devicesInfo = l.devices_info || {};
                        return l.devices_used
                          .map((d) => {
                            const info = devicesInfo[d];
                            if (info && info.latitude && info.longitude) {
                              return `${d} (${info.latitude}, ${info.longitude})`;
                            } else if (info) {
                              return `${d} (${JSON.stringify(info)})`;
                            }
                            return d;
                          })
                          .join(", ");
                      })()
                    ) : (
                      "Not Used"
                    )}
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SELECT LICENSE */}
      <div style={card}>
        <h3>Select User</h3>

        <select onChange={handleSelect} value={selectedLicense}>
          <option value="">-- Select License --</option>
          {licenses.map((l, index) => (
            <option key={index} value={l.license_key}>
              {l.license_key}
            </option>
          ))}
        </select>
      </div>

      {/* TRUST SCORE */}
      {trustData && (
        <div style={card}>
          <h3>Trust Score Analysis</h3>

          <p><b>Score:</b> {trustData.trust_score}</p>
          <p><b>Policy:</b> {trustData.policy}</p>
          <p><b>Events:</b> {trustData.events_detected}</p>
          <p><b>Recent Rate:</b> {trustData.event_rate ?? "N/A"} events/sec</p>

          <div style={{ marginTop: "12px" }}>
            <label>
              <b>Set Trust Score:</b>
              <input
                type="number"
                value={trustScoreInput}
                min="0"
                max="100"
                onChange={(e) => setTrustScoreInput(e.target.value)}
                style={{
                  marginLeft: "10px",
                  width: "80px",
                  padding: "6px",
                  borderRadius: "5px",
                  border: "1px solid #ccc"
                }}
              />
            </label>
            <button
              style={{ ...button, marginTop: "10px" }}
              onClick={updateTrustScore}
            >
              Update Trust Score
            </button>
          </div>

          {/* 🔥 VISUAL BAR */}
          <div style={{
            height: "10px",
            background: "#ddd",
            borderRadius: "5px",
            marginTop: "10px"
          }}>
            <div style={{
              width: `${trustData.trust_score}%`,
              height: "100%",
              background:
                trustData.trust_score > 80 ? "green" :
                trustData.trust_score > 50 ? "orange" : "red",
              borderRadius: "5px"
            }} />
          </div>

          <button style={{ ...button, marginTop: "15px" }} onClick={downloadReport}>
            Download Behavior Report
          </button>
        </div>
      )}

      {/* LOGS */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ margin: 0 }}>Runtime Logs</h3>
          <button
            onClick={() => loadLogs(selectedLicense)}
            disabled={!selectedLicense}
            style={{
              padding: "6px 10px",
              fontSize: "12px",
              border: "none",
              borderRadius: "5px",
              cursor: selectedLicense ? "pointer" : "not-allowed",
              backgroundColor: selectedLicense ? "#0ea5e9" : "#94a3b8",
              color: "white"
            }}
          >
            Refresh
          </button>
        </div>

        <div style={logBox}>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;