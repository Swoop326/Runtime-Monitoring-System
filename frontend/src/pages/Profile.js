import React from "react";

function Profile() {

  const container = {
    height: "100vh",
    backgroundColor: "#f5f7fb",
    padding: "40px"
  };

  const card = {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "400px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
  };

  const item = {
    marginTop: "15px"
  };

  return (
    <div style={container}>

      <h1>User Profile</h1>

      <div style={card}>

        <div style={item}>
          <strong>Name:</strong> Demo User
        </div>

        <div style={item}>
          <strong>Email:</strong> user@example.com
        </div>

        <div style={item}>
          <strong>License Status:</strong> Active
        </div>

        <div style={item}>
          <strong>Device ID:</strong> DEVICE-12345
        </div>

        <div style={item}>
          <strong>Trust Score:</strong> 95
        </div>

      </div>

    </div>
  );
}

export default Profile;