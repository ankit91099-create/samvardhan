import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./admin.css";

const ProtectedRoute = ({ children }) => {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#fff",
        fontSize: "1.1rem",
        fontFamily: "Segoe UI, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: "#94a3b8" }}>Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
