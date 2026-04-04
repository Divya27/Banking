// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AccountDetail from "./pages/AccountDetail";

// ============================================================
// Checks if JWT token exists and is not expired
// Decodes the payload (middle part of JWT) to read expiry
// ============================================================
const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// ============================================================
// ProtectedRoute — wraps pages that need authentication
// If token missing or expired → redirect to /login
// If valid → render the page normally
// ============================================================
const ProtectedRoute = ({ children }) => {
  if (!isTokenValid()) {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }
  return children;
};

// ============================================================
// App — defines all routes
// BrowserRouter  → enables URL routing
// Routes         → container for all Route definitions
// Route          → maps a URL to a component
// Navigate       → redirects to another URL
// ============================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default → redirect to login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Public routes — no token needed */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes — token required */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* :id is the account id — e.g. /account/5 */}
        <Route
          path="/account/:id"
          element={
            <ProtectedRoute>
              <AccountDetail />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
