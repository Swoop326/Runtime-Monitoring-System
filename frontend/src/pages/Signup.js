import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");

  const navigate = useNavigate();

  const handleSignup = async () => {

    if (!username || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {

      const res = await fetch("http://localhost:5000/signup", {
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
      console.log("Signup response:", data);

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
    width: "350px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center"
  };

  const input = {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  };

  const button = {
    width: "100%",
    padding: "10px",
    marginTop: "20px",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  };

  return (
    <div style={container}>

      <div style={card}>

        <h2>Create Account</h2>

        <input
          style={input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          style={input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={button} onClick={handleSignup}>
          Sign Up
        </button>

        <p style={{ marginTop: "15px" }}>
          Already have an account? <Link to="/">Login</Link>
        </p>

      </div>

    </div>
  );
}

export default Signup;