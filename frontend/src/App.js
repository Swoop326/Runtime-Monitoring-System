import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import License from "./pages/License";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <HashRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route
          path="/license"
          element={
            <ProtectedRoute>
              <License />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
        path="/admin"
        element={
        <ProtectedRoute>
        <AdminDashboard />
        </ProtectedRoute>
        }
      />

      </Routes>
    </HashRouter>
  );
}

export default App;