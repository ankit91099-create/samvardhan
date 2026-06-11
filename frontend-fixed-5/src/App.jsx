import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import Services from "./components/Services";
import Chatbot from "./components/Chatbot";
import Admin from "./components/Admin";
import AdminLogin from "./components/AdminLogin";

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Stub pages
const About   = () => <h1 style={{ padding: "120px 6vw" }}>About — coming soon</h1>;
const Therapy = () => <h1 style={{ padding: "120px 6vw" }}>Therapies — coming soon</h1>;
const Contact = () => <h1 style={{ padding: "120px 6vw" }}>Contact — coming soon</h1>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />

        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Home />} />
          <Route path="/about"    element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/therapy"  element={<Therapy />} />
          <Route path="/contact"  element={<Contact />} />

          {/* Admin auth */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected admin dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Redirect old /admin path if needed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global chatbot — visible on all public pages */}
        <Chatbot />
      </Router>
    </AuthProvider>
  );
}

export default App;
