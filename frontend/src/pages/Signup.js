import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

function Signup() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = async () => {

    if (!username || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {

      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Account created successfully");
        navigate("/");
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Signup failed");
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

        <h2 style={{ marginBottom: "5px" }}>Create Account</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Join AdaptiveDesk Secure System
        </p>

        <input
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

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
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          onClick={handleSignup}
        >
          Sign Up
        </button>

        <p style={{ marginTop: "15px", fontSize: "14px" }}>
          Already have an account? <Link to="/">Login</Link>
        </p>

      </div>

    </div>
  );
}

export default Signup;