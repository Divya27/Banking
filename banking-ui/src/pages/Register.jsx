// src/pages/Register.jsx

import { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {

  // ============================================================
  // STATE VARIABLES
  // Matches exactly your Spring Boot register request body:
  // { username, email, password }
  // ============================================================
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ============================================================
  // HANDLE REGISTER
  // ============================================================
  const handleRegister = async () => {
    setError("");
    setSuccess("");

    // Validation
    if (!username || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Calls POST /api/auth/register
      // Body: { username, email, password } → 201 success
      const result = await registerUser(username, email, password);

      if (result.success) {
        setSuccess("Account created! You can now sign in.");
        // Clear form
        setUsername("");
        setEmail("");
        setPassword("");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError("Registration failed. Email may already be in use.");
      }

    } catch (err) {
      setError("Cannot reach server. Is Spring Boot running?", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // JSX
  // ============================================================
  return (
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
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Start banking!</p>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            Username
          </label>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                       text-white placeholder-slate-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                       transition-all duration-200"
          />
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="mb-6">
          <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                       text-white placeholder-slate-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                       transition-all duration-200"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3 bg-emerald-950 border border-emerald-800 rounded-lg">
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold rounded-xl
                     transition-all duration-200"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        {/* Link to Login */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-emerald-400 hover:text-emerald-300 font-medium">
            Sign In
          </button>
        </p>

      </div>
    </div>
  );
}
