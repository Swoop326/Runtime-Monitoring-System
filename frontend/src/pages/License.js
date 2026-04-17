import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";

function License() {

  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ CHECK EXISTING ACCESS
  useEffect(() => {

    const checkExistingAccess = async () => {

      const storedKey = localStorage.getItem("licenseKey");
      if (!storedKey) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/validate-access?device_id=${getDeviceId()}&license_key=${storedKey}`
        );

        const data = await res.json();

        if (data.allowed) {
          navigate("/dashboard");
        }

      } catch (error) {
        console.error(error);
      }
    };

    checkExistingAccess();

  }, []);

  const activateLicense = async () => {

    if (!licenseKey) {
      alert("Please enter a license key");
      return;
    }

    try {

      setLoading(true);

      const deviceId = getDeviceId();

      const res = await fetch(`${API_BASE_URL}/activate-license`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          license_key: licenseKey,
          device_id: deviceId
        })
      });

      const data = await res.json();

      // ✅ SUCCESS
      if (data.success) {

        localStorage.setItem("device_id", deviceId);
        localStorage.setItem("licenseKey", licenseKey);

        alert(data.message);
        navigate("/dashboard");
        return;
      }

      // 🔥 DEVICE SWITCH
      if (data.override_required) {

        const confirmSwitch = window.confirm(
          "License already active on another device.\nDo you want to switch device?"
        );

        if (confirmSwitch) {

          const res2 = await fetch(`${API_BASE_URL}/force-switch`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              license_key: licenseKey,
              device_id: deviceId
            })
          });

          const data2 = await res2.json();

          if (data2.success) {
            localStorage.setItem("device_id", deviceId);
            localStorage.setItem("licenseKey", licenseKey);

            alert("Device switched successfully");
            navigate("/dashboard");
          }
        }

        return;
      }

      alert(data.message);

    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f7fb"
    }}>

      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "12px",
        width: "380px",
        boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>

        <h2 style={{ marginBottom: "5px" }}>Activate License</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Enter your license key to access the system
        </p>

        <input
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
          placeholder="XXXX-XXXX-XXXX"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
        />

        <button
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "20px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          onClick={activateLicense}
        >
          {loading ? "Activating..." : "Activate License"}
        </button>

      </div>
    </div>
  );
}

export default License;