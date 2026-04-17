import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {

      const deviceId = getDeviceId();

      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", data.role);
        localStorage.setItem("device_id", deviceId);

        if (data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/license");
        }

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Login failed");
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
        width: "360px",
        boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>

        <h2 style={{ marginBottom: "5px" }}>AdaptiveDesk</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Secure Licensed Access
        </p>

        <input
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "20px",
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          onClick={handleLogin}
        >
          Login
        </button>

        <p style={{ marginTop: "15px", fontSize: "14px" }}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;