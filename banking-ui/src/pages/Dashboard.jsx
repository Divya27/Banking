// src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllAccounts, getTransactions, createAccount, getMe } from "../services/api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  // New account modal state
  const [newAccountModal, setNewAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("SAVINGS");
  const [newAccountLoading, setNewAccountLoading] = useState(false);
  const [newAccountError, setNewAccountError] = useState("");
  const [newAccountSuccess, setNewAccountSuccess] = useState("");

  // ============================================================
  // FETCH ON MOUNT
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [accountsData, recentTxData, allTxData, userData] = await Promise.all([
        getAllAccounts(),
        getTransactions(0, 10),
        getTransactions(0, 100),
        getMe(),
      ]);

      setAccounts(accountsData);
      setTransactions(recentTxData.content || []);
      setAllTransactions(allTxData.content || []);
      setCurrentUser(userData);
      setNewAccountName(userData?.username || "");

    } catch (err) {
      setError("Failed to load dashboard data.", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CREATE ACCOUNT HANDLER
  // ============================================================
  const handleCreateAccount = async () => {
    setNewAccountError("");
    setNewAccountSuccess("");

    if (!newAccountName.trim()) {
      setNewAccountError("Account holder name is required.");
      return;
    }

    setNewAccountLoading(true);
    try {
      const result = await createAccount(newAccountName, 0, newAccountType);

      if (result.id) {
        setNewAccountSuccess("Account created successfully!");
        await fetchDashboardData();
        setTimeout(() => {
          setNewAccountModal(false);
          setNewAccountType("SAVINGS");
          setNewAccountSuccess("");
          setNewAccountError("");
        }, 1500);
      } else {
        setNewAccountError("Failed to create account. Please try again.");
      }
    } catch (err) {
      setNewAccountError("Cannot reach server. Is Spring Boot running?", err);
    } finally {
      setNewAccountLoading(false);
    }
  };

  // ============================================================
  // STATS — last 30 days
  // ============================================================
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30Days = allTransactions.filter(
    tx => new Date(tx.timestamp) >= thirtyDaysAgo
  );

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const myAccountIds = accounts.map(acc => acc.id);

  const totalIn = last30Days
    .filter(tx =>
      tx.type === "DEPOSIT" ||
      (tx.type === "TRANSFER" && myAccountIds.includes(tx.toAccountId))
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalOut = last30Days
    .filter(tx =>
      tx.type === "WITHDRAW" ||
      (tx.type === "TRANSFER" && myAccountIds.includes(tx.fromAccountId))
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const categoryData = last30Days.reduce((acc, tx) => {
    const cat = tx.category || "OTHER";
    acc[cat] = (acc[cat] || 0) + tx.amount;
    return acc;
  }, {});

  const totalSpend = Object.values(categoryData).reduce((a, b) => a + b, 0);

  const categories = Object.entries(categoryData)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  // ============================================================
  // HELPERS
  // ============================================================
  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 2,
    }).format(amount);

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const catColors = {
    FOOD: "#1D9E75", SHOPPING: "#378ADD", TRAVEL: "#EF9F27",
    ENTERTAINMENT: "#D4537E", UTILITIES: "#8B5CF6",
    HEALTHCARE: "#EC4899", EDUCATION: "#F97316",
    TRANSFER: "#64748b", OTHER: "#94a3b8",
  };

  const cardColors = ["#1D9E75", "#378ADD", "#EF9F27", "#D4537E"];

  // ============================================================
  // DARK MODE HELPERS
  // ============================================================
  const bg = darkMode ? "bg-gray-950" : "bg-slate-50";
  const card = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200";
  const text = darkMode ? "text-white" : "text-slate-800";
  const muted = darkMode ? "text-gray-500" : "text-slate-400";
  const divider = darkMode ? "border-gray-800" : "border-slate-100";
  const statBg = darkMode ? "bg-gray-800" : "bg-slate-50";
  const inputCls = darkMode
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400";

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className={`text-sm ${muted}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={`min-h-screen ${bg}`}>

      {/* ── NAVBAR ── */}
      <Navbar
        darkMode={darkMode}
        onToggleDark={() => {
          const next = !darkMode;
          setDarkMode(next);
          localStorage.setItem("darkMode", next);
        }}
      />

      <div className="px-6 py-6 max-w-5xl mx-auto">

        {/* Page header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className={`text-xl font-medium ${text}`}>Dashboard</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>
              Welcome back, {currentUser?.username || accounts[0]?.accountHolderName?.split(" ")[0] || "there"}
            </p>
          </div>
          <button
            onClick={() => {
              setNewAccountModal(true);
              setNewAccountError("");
              setNewAccountSuccess("");
            }}
            className="text-sm font-medium px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            + New Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* ── ACCOUNT CARDS ── */}
        <p className={`text-xs mb-2 ${muted}`}>Your accounts · scroll for more →</p>
        <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
          {accounts.length === 0 ? (
            <div className={`rounded-xl border p-6 text-sm ${card} ${muted}`}>
              No accounts yet. Create one to get started.
            </div>
          ) : (
            accounts.map((account, index) => {
              const color = cardColors[index % cardColors.length];
              return (
                <div
                  key={account.id}
                  onClick={() => navigate(`/account/${account.id}`)}
                  className={`min-w-[200px] flex-shrink-0 rounded-xl border p-4 cursor-pointer relative overflow-hidden transition-all ${darkMode
                    ? "bg-gray-900 border-gray-800 hover:border-emerald-600"
                    : "bg-white border-slate-200 hover:border-emerald-400"
                    }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
                  <p className={`text-xs uppercase tracking-wider mb-1 ${muted}`}>
                    {account.accountType || "Account"}
                  </p>
                  <p className={`text-sm font-medium mb-3 ${text}`}>
                    {account.accountHolderName}
                  </p>
                  <p className={`text-xs ${muted}`}>Balance</p>
                  <p className={`text-lg font-medium mt-0.5 ${text}`}>
                    {formatAmount(account.balance)}
                  </p>
                  <p className={`text-xs mt-2 ${muted}`}>Account #{account.id}</p>
                  <span className="absolute bottom-3 right-3 text-xs" style={{ color }}>→</span>
                </div>
              );
            })
          )}
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total balance", value: formatAmount(totalBalance), valueClass: text, sub: "All accounts" },
            { label: "Total received (30d)", value: formatAmount(totalIn), valueClass: "text-emerald-600", sub: "Inflow" },
            { label: "Total spent (30d)", value: formatAmount(totalOut), valueClass: "text-red-500", sub: "Outflow" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-4 ${card}`}>
              <p className={`text-xs mb-1 ${muted}`}>{stat.label}</p>
              <p className={`text-lg font-medium ${stat.valueClass}`}>{stat.value}</p>
              <p className={`text-xs mt-1 ${muted}`}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── SPENDING BY CATEGORY ── */}
        <div className={`rounded-xl border p-5 mb-4 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-sm font-medium ${text}`}>Spending by category</h2>
              <p className={`text-xs mt-0.5 ${muted}`}>Last 30 days</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
              AI
            </span>
          </div>

          {categories.length === 0 ? (
            <p className={`text-sm ${muted}`}>
              No categorized transactions in the last 30 days.
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const barColor = catColors[cat.name] || "#94a3b8";
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: barColor }} />
                    <span className={`text-xs w-24 flex-shrink-0 ${muted}`}>
                      {cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}
                    </span>
                    <div className={`flex-1 h-1.5 rounded-full ${statBg}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percent}%`, background: barColor }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-8 text-right ${text}`}>
                      {cat.percent}%
                    </span>
                    <span className={`text-xs w-20 text-right ${muted}`}>
                      {formatAmount(cat.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RECENT TRANSACTIONS ── */}
        <div className={`rounded-xl border ${card}`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
            <h2 className={`text-sm font-medium ${text}`}>Recent transactions</h2>
            <span className={`text-xs ${muted}`}>All accounts · last 10</span>
          </div>

          {transactions.length === 0 ? (
            <p className={`text-sm p-5 ${muted}`}>No transactions yet.</p>
          ) : (
            transactions.map((tx, i) => {
              const isDeposit = tx.type === "DEPOSIT";
              const isWithdraw = tx.type === "WITHDRAW";
              const isTransfer = tx.type === "TRANSFER";

              return (
                <div
                  key={tx.transactionId}
                  className={`flex items-center justify-between px-5 py-3 ${i !== transactions.length - 1 ? `border-b ${divider}` : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isDeposit ? "bg-emerald-50 text-emerald-600" :
                      isWithdraw ? "bg-red-50 text-red-500" :
                        "bg-blue-50 text-blue-500"
                      }`}>
                      {isDeposit ? "↑" : isWithdraw ? "↓" : "⇄"}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${text}`}>
                        {tx.type?.charAt(0) + tx.type?.slice(1).toLowerCase()}
                        {tx.description && (
                          <span className={`font-normal ml-1.5 text-xs ${muted}`}>
                            · {tx.description}
                          </span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 ${muted}`}>
                        {isTransfer
                          ? `From #${tx.fromAccountId} → To #${tx.toAccountId}`
                          : `Account #${tx.fromAccountId || tx.toAccountId}`
                        } · {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isDeposit ? "text-emerald-600" :
                      isWithdraw ? "text-red-500" :
                        "text-blue-500"
                      }`}>
                      {isDeposit ? "+" : isWithdraw ? "−" : ""}
                      {formatAmount(tx.amount)}
                    </p>
                    {tx.category && (
                      <p className={`text-xs mt-0.5 ${muted}`}>
                        {tx.category.charAt(0) + tx.category.slice(1).toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ── NEW ACCOUNT MODAL ── */}
      {newAccountModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.target === e.currentTarget && setNewAccountModal(false)}
        >
          <div className={`w-full max-w-sm rounded-2xl border p-6 ${card}`}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-medium ${text}`}>Create New Account</h3>
              <p className={`text-xs mt-0.5 ${muted}`}>Opens with ₹0 balance</p>
              <button
                onClick={() => setNewAccountModal(false)}
                className={`text-lg leading-none ${muted}`}
              >
                ✕
              </button>
            </div>

            {/* Account Holder Name — pre-filled */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${muted}`}>
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="e.g. Divya Ahuja"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${inputCls}`}
              />
            </div>

            {/* Account Type */}
            <div className="mb-5">
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${muted}`}>
                Account Type
              </label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${inputCls}`}
              >
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
              </select>
            </div>

            {/* Error */}
            {newAccountError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{newAccountError}</p>
              </div>
            )}

            {/* Success */}
            {newAccountSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-emerald-700 text-sm">{newAccountSuccess}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleCreateAccount}
              disabled={newAccountLoading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {newAccountLoading ? "Creating..." : "Create Account"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
