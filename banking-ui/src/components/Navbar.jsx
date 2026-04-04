
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logoutUser } from "../services/api";

// ============================================================
// CONCEPT: Reusable component with props
// Props this component accepts:
//   darkMode       → current theme state
//   onToggleDark   → function to toggle theme
//   showBack       → show "← My Accounts" button (AccountDetail only)
// ============================================================

export default function Navbar({ darkMode, onToggleDark, showBack = false }) {
  const navigate = useNavigate();

  // Controls whether dropdown is open or closed
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // User info read from JWT token in localStorage
  const [userInfo, setUserInfo] = useState({ username: "", email: "", createdAt: "" });

  // CONCEPT: useRef
  // A ref lets us reference a DOM element directly
  // We use it to detect clicks outside the dropdown
  // Like document.getElementById() but the React way
  const dropdownRef = useRef(null);

  // ============================================================
  // Read user info from JWT token on mount
  // JWT payload contains the email (sub field)
  // ============================================================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMe();
        setUserInfo({
          username: data.username || "",
          email: data.email || "",
          createdAt: data.createdAt || "",
        });
      } catch {
        setUserInfo({ username: "User", email: "", createdAt: "" });
      }
    };
    fetchProfile();
  }, []);

  // ============================================================
  // CONCEPT: click outside to close dropdown
  // Adds a mousedown listener to the document
  // If click is outside the dropdown ref → close it
  // Removes listener on cleanup (return function in useEffect)
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside); // cleanup
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser(); // blacklist the token
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      // clear the local storage and reedirect
      localStorage.removeItem("token");
      localStorage.removeItem("darkMode");
      navigate("/login");
    }
  };

  // ============================================================
  // DARK MODE STYLES
  // ============================================================
  const navBg = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200";
  const text = darkMode ? "text-white" : "text-slate-800";
  const muted = darkMode ? "text-gray-400" : "text-slate-500";
  const dropBg = darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-slate-200";
  const hoverBg = darkMode ? "hover:bg-gray-800" : "hover:bg-slate-50";
  const divider = darkMode ? "border-gray-800" : "border-slate-100";

  // Avatar initials — first letter of username
  const initials = userInfo.username?.charAt(0)?.toUpperCase() || "U";

  return (
    <nav className={`sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b ${navBg}`}>

      {/* ── LEFT SIDE ── */}
      <div className="flex items-center gap-3">

        {/* Back button — only on AccountDetail page */}
        {showBack && (
          <button
            onClick={() => navigate("/dashboard")}
            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 mr-2 ${darkMode ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
          >
            ← My Accounts
          </button>
        )}

        {/* Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <span className={`font-medium text-sm ${text}`}>Banking system</span>
        </div>
      </div>

      {/* ── RIGHT SIDE ── */}
      <div className="flex items-center gap-3">

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${darkMode
            ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
        >
          {darkMode ? "☀ Light" : "☾ Dark"}
        </button>

        {/* Profile avatar + dropdown
            CONCEPT: relative positioning
            The dropdown is absolute positioned relative to this div */}
        <div className="relative" ref={dropdownRef}>

          {/* Avatar button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-700 hover:ring-2 hover:ring-emerald-400 transition-all"
          >
            {initials}
          </button>

          {/* Dropdown menu
              CONCEPT: conditional rendering
              Only renders when dropdownOpen is true           */}
          {dropdownOpen && (
            <div className={`absolute right-0 top-10 w-56 rounded-xl border shadow-lg z-50 overflow-hidden ${dropBg}`}>

              {/* User info section */}
              <div className={`px-4 py-3 border-b ${divider}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-medium text-emerald-700 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${text}`}>
                      {userInfo.username}
                    </p>
                    <p className={`text-xs truncate mt-0.5 ${muted}`}>
                      {userInfo.email}
                    </p>
                    {/* Member since */}
                    {userInfo.createdAt && (
                      <p className={`text-xs mt-1 ${muted}`}>
                        Member since {new Date(userInfo.createdAt).toLocaleDateString("en-IN", {
                          month: "short", year: "numeric"
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">

                {/* Dashboard link */}
                <button
                  onClick={() => { navigate("/dashboard"); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 ${muted} ${hoverBg} transition-colors`}
                >
                  <span className="text-base">⊞</span>
                  Dashboard
                </button>

                {/* Divider */}
                <div className={`my-1 border-t ${divider}`} />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 text-red-500 ${hoverBg} transition-colors`}
                >
                  <span className="text-base">→</span>
                  Sign out
                </button>

              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
