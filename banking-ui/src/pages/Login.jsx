// src/pages/Login.jsx

import { useState } from "react";
import { loginUser } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {

  // ============================================================
  // STATE VARIABLES
  // useState(initialValue) → [currentValue, setterFunction]
  // When setter is called, React re-renders the component
  // ============================================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ============================================================
  // HANDLE LOGIN
  // Validates inputs → calls api.js → saves token on success
  // ============================================================
  const handleLogin = async () => {
    // Clear previous error
    setError("");

    // Validation — check before hitting the API
    if (!email || !password) {
      setError("Email and password are required.");
      return; // no api call
    }

    // Show loading state
    setLoading(true);

    try {
      // Call api.js — no fetch() here in the UI
      const result = await loginUser(email, password);

      if (result.success) {
        // Save JWT token — all future API calls will use this
        localStorage.setItem("token", result.token);

        alert("Login successful! Token saved.");
        navigate('/dashboard');
      } else {
        setError("Invalid email or password.");
      }

    } catch (err) {
      // Network error — Spring Boot not running, CORS issue etc.
      setError("Cannot reach server. Is Spring Boot running?", err);
    } finally {
      // Always stop loading — whether success or failure
      setLoading(false);
    }
  };

  // ============================================================
  // JSX — What gets rendered in the browser
  // Rules:
  //   className instead of class
  //   {expression} to embed JS values
  //   self closing tags: <input />
  //   only ONE root element
  // ============================================================
  return (
    // min-h-screen = full viewport height
    // bg-slate-950 = very dark background
    // flex items-center justify-center = center everything
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Bank System</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Email input
            CONCEPT: controlled input
            value={email}         → input always shows what's in state
            onChange={...}        → every keystroke updates state     */}
        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                       text-white placeholder-slate-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                       transition-all duration-200"
          />
        </div>

        {/* Password input */}
        <div className="mb-6">
          <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                       text-white placeholder-slate-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                       transition-all duration-200"
          />
        </div>

        {/* Error message
            CONCEPT: conditional rendering
            {error && <JSX />} → only renders when error is non-empty */}
        {error && (
          <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit button
            disabled={loading} → prevents double submit
            {loading ? "..." : "..."} → changes label while waiting */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold rounded-xl
                     transition-all duration-200"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* Link to Register — will wire navigation after React Router setup */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-emerald-400 hover:text-emerald-300 font-medium">
            Register
          </button>
        </p>

      </div>
    </div>
  );
}
