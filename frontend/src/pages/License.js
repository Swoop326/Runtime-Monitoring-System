import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function License() {

  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const activateLicense = async () => {

  if (!licenseKey) {
    alert("Please enter a license key");
    return;
  }

  try {

    setLoading(true);

    const res = await fetch("http://localhost:5000/activate-license", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        license_key: licenseKey
      })
    });

    const data = await res.json();

    if (data.success) {

      alert(data.message || "License Activated Successfully");
      navigate("/dashboard");

    } else {

      alert(data.message || "Invalid License");

    }

  } catch (error) {

    console.error(error);
    alert("Server error. Please try again.");

  } finally {

    setLoading(false);

  }

};

  const container = {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb"
  };

  const card = {
    background: "white",
    padding: "40px",
    borderRadius: "10px",
    width: "400px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center"
  };

  const input = {
    width: "100%",
    padding: "10px",
    marginTop: "15px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  };

  const button = {
    width: "100%",
    padding: "10px",
    marginTop: "20px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  };

  return (
    <div style={container}>

      <div style={card}>

        <h2>Activate License</h2>

        <p>Enter your software license key to continue</p>

        <input
          style={input}
          placeholder="XXXX-XXXX-XXXX"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
        />

        <button style={button} onClick={activateLicense}>
          {loading ? "Activating..." : "Activate License"}
        </button>

      </div>

    </div>
  );
}

export default License;