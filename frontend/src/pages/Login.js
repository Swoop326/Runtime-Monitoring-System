import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import getDeviceId from "../utils/device";  // ✅ IMPORTANT

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

      // 🔥 ENSURE DEVICE ID IS CREATED & STORED
      const deviceId = getDeviceId();

      console.log("Device ID:", deviceId); // (optional debug)

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

        // ✅ device_id already stored by getDeviceId()
        localStorage.setItem("device_id", deviceId);

        if (data.role === "admin") {
          navigate("/admin");
        } else {
          // ✅ ALWAYS go to license (backend decides access)
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
        borderRadius: "10px",
        width: "350px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>

        <h2>AdaptiveDesk</h2>
        <p>Licensed Software Access</p>

        <input
          style={{ width: "100%", padding: "10px", marginTop: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={{ width: "100%", padding: "10px", marginTop: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={{ width: "100%", padding: "10px", marginTop: "20px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
          onClick={handleLogin}
        >
          Login
        </button>

        <p style={{ marginTop: "15px" }}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;