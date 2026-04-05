// src/pages/AccountDetail.jsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import SpendingInsights from "../components/SpendingInsights";

import {
  getAccount,
  deposit,
  withdraw,
  transfer,
  getTransactionsByAccountId,
  createPaymentOrder,
  verifyPayment,
  getAiInsights
} from "../services/api";

// ============================================================
// CONCEPT: useParams
// Reads the :id from the URL
// e.g. /account/5 → params.id = "5"
// Like @PathVariable in Spring Boot
// ============================================================

export default function AccountDetail() {
  // const navigate = useNavigate();
  const { id } = useParams(); // ← reads account id from URL
  console.log("ID:: ", id)

  // ============================================================
  // STATE
  // ============================================================
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  // AI insights state
  const [aiInsights, setAiInsights] = useState("");
  // idle     → not started yet
  // loading  → waiting for Claude
  // success  → insights received
  // rate_limit → free tier exhausted
  // no_data  → no transactions in 30 days
  // no_categories → no categorized transactions
  // error    → something went wrong
  const [aiStatus, setAiStatus] = useState("idle");


  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);  // Spring Boot pages start at 0
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 5;

  // Modal state
  // CONCEPT: one state controls which modal is open
  // null = no modal, "deposit" / "withdraw" / "transfer" = that modal
  const [modal, setModal] = useState(null);

  // Modal form fields
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [toAccountId, setToAccountId] = useState(""); // for transfer only
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // ============================================================
  // FETCH ON MOUNT + when page changes
  // ============================================================
  useEffect(() => {
    fetchData();
  }, [currentPage]); // ← re-runs whenever currentPage changes

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [accountData, txData] = await Promise.all([
        getAccount(id),
        getTransactionsByAccountId(id, currentPage, PAGE_SIZE),
      ]);

      setAccount(accountData);
      setTransactions(txData.content || []);
      setTotalPages(txData.totalPages || 0);
      setTotalElements(txData.totalElements || 0);

      // Only fetch AI insights on first page load
      // Not on every pagination click — saves API calls
      if (currentPage === 0) {
        fetchAiInsights(); // ← runs in background, doesn't block page load
      }

    } catch (err) {
      setError("Failed to load account details.", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MODAL HANDLERS
  // ============================================================
  const openModal = (type) => {
    setModal(type);
    setAmount("");
    setCategory("OTHER");
    setDescription("");
    setToAccountId("");
    setModalError("");
    setModalSuccess("");
  };

  const closeModal = () => {
    setModal(null);
    setModalError("");
    setModalSuccess("");
    setModalLoading(false);
    setAmount("");
    setCategory("OTHER");
    setDescription("");
    setToAccountId("");
  };

  const handleModalSubmit = async () => {
    setModalError("");
    setModalSuccess("");

    // Validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setModalError("Please enter a valid amount.");
      return;
    }
    if (modal === "transfer" && !toAccountId) {
      setModalError("Please enter a destination account ID.");
      return;
    }

    setModalLoading(true);

    try {
      let result;

      if (modal === "deposit") {
        /**
         * Before → deposit modal → calls deposit API directly
            After  → deposit modal → creates Razorpay order → opens popup → verifies → updates balance
         */
        result = await deposit(id, Number(amount), category, description);
        setModalSuccess(`Successfully deposited ${formatAmount(Number(amount))}`);
      } else if (modal === "withdraw") {
        result = await withdraw(id, Number(amount), category, description);
        setModalSuccess(`Successfully withdrew ${formatAmount(Number(amount))}`);
      } else if (modal === "transfer") {
        result = await transfer(id, Number(toAccountId), Number(amount));
        setModalSuccess(`Successfully transferred ${formatAmount(Number(amount))}`);
      }
      console.log("result:: ", result);
      // Refresh account + transactions after action
      await fetchData();
      setTimeout(() => closeModal(), 1500);

    } catch (err) {
      setModalError("Transaction failed. Please try again.", err);
    } finally {
      setModalLoading(false);
    }
  };

  // ============================================================
  // RAZORPAY DEPOSIT FLOW
  // Replaces direct deposit API call with Razorpay payment
  // ============================================================
  const handleRazorpayDeposit = async () => {
    setModalError("");
    setModalSuccess("");

    // Validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setModalError("Please enter a valid amount.");
      return;
    }

    setModalLoading(true);

    try {
      // STEP 1 — Create order on Spring Boot
      // Spring Boot calls Razorpay API and returns orderId
      const order = await createPaymentOrder(id, Number(amount));

      if (!order.orderId) {
        setModalError("Failed to create payment order. Try again.");
        setModalLoading(false);
        return;
      }

      // STEP 2 — Open Razorpay checkout popup
      // window.Razorpay as added the script in index.html
      const options = {
        key: order.keyId,              // rzp_test_xxxx — from Spring Boot response
        amount: order.amount,          // in paise — Razorpay handles display
        currency: order.currency,      // INR
        name: "NeoBank",               // shown in popup header
        description: description || `Deposit to Account #${id}`,
        order_id: order.orderId,       // rzp_order_xxxx — links payment to order

        // STEP 3 — Called when user completes payment successfully
        handler: async (response) => {
          try {
            // response contains:
            // razorpay_payment_id → unique payment ID
            // razorpay_order_id   → matches our order
            // razorpay_signature  → we verify this on Spring Boot
            const result = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              Number(id),
              Number(amount),
              category,
              description
            );

            if (result.success) {
              setModalSuccess(`Payment successful! ₹${amount} deposited.`);
              await fetchData();
              setTimeout(() => closeModal(), 1500);
            } else {
              setModalError("Payment verification failed.");
              setModalLoading(false);
            }
          } catch (err) {
            setModalError("Verification error. Contact support.", err);
            setModalLoading(false);
          }
        },

        // Called when user closes the popup without paying
        modal: {
          ondismiss: () => {
            setModalLoading(false);
            setModalError("Payment cancelled.");
          },
        },

        // Pre-fill user details in Razorpay popup
        prefill: {
          name: account?.accountHolderName || "",
          email: "",  // optional — add if you have it
        },

        // Razorpay popup theme
        theme: {
          color: "#1D9E75", // matches your app's green
        },
      };

      // Open the Razorpay popup
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      setModalError("Cannot reach server. Is Spring Boot running?", err);
      setModalLoading(false);
    }
  };

  // ============================================================
  // FETCH AI INSIGHTS
  // Calls Spring Boot → Spring Boot calls Claude
  // Only runs on first page load (currentPage === 0)
  // ============================================================
  const fetchAiInsights = async () => {
    setAiStatus("loading");
    try {
      // Returns { insights: "...", status: "success|rate_limit|..." }
      const data = await getAiInsights(id);

      // Update state based on status from Spring Boot
      setAiStatus(data.status);
      setAiInsights(data.insights || "");

    } catch (err) {
      // Network error — Spring Boot not reachable
      console.error("AI insights error:", err);
      setAiStatus("error");
      setAiInsights("");
    }
  };

  // ============================================================
  // STATS — last 30 days
  // ============================================================
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30 = transactions.filter(
    tx => new Date(tx.timestamp) >= thirtyDaysAgo
  );

  const inflow = last30
    .filter(tx => tx.type === "DEPOSIT" ||
      (tx.type === "TRANSFER" && String(tx.toAccountId) === String(id)))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const outflow = last30
    .filter(tx => tx.type === "WITHDRAW" ||
      (tx.type === "TRANSFER" && String(tx.fromAccountId) === String(id)))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const transferCount = transactions.filter(tx => tx.type === "TRANSFER").length;

  // Category breakdown for this account
  const categoryData = last30.reduce((acc, tx) => {
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
  const formatAmount = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 2,
    }).format(amt);

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const catColors = {
    FOOD: "#1D9E75", SHOPPING: "#378ADD", TRAVEL: "#EF9F27",
    ENTERTAINMENT: "#D4537E", UTILITIES: "#8B5CF6",
    HEALTHCARE: "#EC4899", EDUCATION: "#F97316",
    TRANSFER: "#64748b", OTHER: "#94a3b8",
  };

  const categories_list = [
    "FOOD", "SHOPPING", "TRAVEL", "ENTERTAINMENT",
    "UTILITIES", "HEALTHCARE", "EDUCATION", "OTHER"
  ];

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
  if (loading && !account) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className={`text-sm ${muted}`}>Loading account...</p>
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
        showBack={true}
      />

      <div className="px-6 py-6 max-w-4xl mx-auto">

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* ── BALANCE CARD ── */}
        {account && (
          <div className={`rounded-xl border p-5 mb-4 relative overflow-hidden ${card}`}>
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className={`text-base font-medium ${text}`}>{account.accountHolderName}</h1>
                <p className={`text-xs mt-0.5 ${muted}`}>
                  Account #{account.id} · {account.accountType || "Account"}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                Active
              </span>
            </div>

            <p className={`text-xs uppercase tracking-wider ${muted}`}>Current balance</p>
            <p className={`text-4xl font-medium mt-1 ${text}`}>
              <span className={`text-xl mr-1 ${muted}`}>₹</span>
              {account.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>

            {/* Action buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => openModal("deposit")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                + Deposit
              </button>
              <button
                onClick={() => openModal("withdraw")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                − Withdraw
              </button>
              <button
                onClick={() => openModal("transfer")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                ⇄ Transfer
              </button>
            </div>
          </div>
        )}

        {/* ── STATS + SPENDING INSIGHTS ── */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          {/* Left — account stats */}
          <div className={`rounded-xl border p-4 ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-medium ${text}`}>Account stats</h2>
              <span className={`text-xs ${muted}`}>Last 30 days</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Inflow", value: formatAmount(inflow), cls: "text-emerald-600" },
                { label: "Outflow", value: formatAmount(outflow), cls: "text-red-500" },
                { label: "Transactions", value: transactions.length, cls: text },
                { label: "Transfers", value: transferCount, cls: text },
              ].map((s) => (
                <div key={s.label} className={`rounded-lg p-3 ${statBg}`}>
                  <p className={`text-xs ${muted}`}>{s.label}</p>
                  <p className={`text-base font-medium mt-0.5 ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — donut chart + AI insights */}
          <SpendingInsights
            transactions={transactions}
            darkMode={darkMode}
            aiInsights={aiInsights}
            aiStatus={aiStatus}
          />

        </div>

        {/* ── TRANSACTIONS LIST ── */}
        <div className={`rounded-xl border ${card}`}>

          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
            <h2 className={`text-sm font-medium ${text}`}>Transactions</h2>
            <span className={`text-xs ${muted}`}>
              Page {currentPage + 1} of {totalPages} · {totalElements} total
            </span>
          </div>

          {/* Rows */}
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
                    {/* Icon */}
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

                  {/* Amount + category */}
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

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-5 py-3 border-t ${divider}`}>
              <span className={`text-xs ${muted}`}>
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements}
              </span>
              <div className="flex gap-1.5">
                {/* Prev button */}
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 0}
                  className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center ${currentPage === 0
                    ? `opacity-30 cursor-not-allowed ${card}`
                    : `cursor-pointer ${card} hover:border-emerald-400`
                    }`}
                >
                  ←
                </button>

                {/* Page numbers
                    CONCEPT: Array.from creates array of length totalPages
                    e.g. totalPages=3 → [0,1,2] → renders 3 buttons */}
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center ${currentPage === i
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : `${card} hover:border-emerald-400 ${text}`
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Next button */}
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages - 1}
                  className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center ${currentPage === totalPages - 1
                    ? `opacity-30 cursor-not-allowed ${card}`
                    : `cursor-pointer ${card} hover:border-emerald-400`
                    }`}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MODAL
          CONCEPT: modal is shown by checking modal state
          {modal && <JSX />} renders only when modal is set
      ══════════════════════════════════════════════ */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className={`w-full max-w-sm rounded-2xl border p-6 ${card}`}>

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-medium ${text}`}>
                {modal === "deposit" && `Deposit to Account #${id}`}
                {modal === "withdraw" && `Withdraw from Account #${id}`}
                {modal === "transfer" && `Transfer from Account #${id}`}
              </h3>
              <button
                onClick={closeModal}
                className={`text-lg leading-none ${muted} hover:${text}`}
              >
                ✕
              </button>
            </div>

            {/* Transfer — To Account ID field */}
            {modal === "transfer" && (
              <div className="mb-4">
                <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${muted}`}>
                  To Account ID
                </label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${inputCls}`}
                />
              </div>
            )}

            {/* Amount */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${muted}`}>
                Amount (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${inputCls}`}
              />
            </div>

            {/* Category — not shown for transfer */}
            {modal !== "transfer" && (
              <div className="mb-4">
                <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${muted}`}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${inputCls}`}
                >
                  {categories_list.map(c => (
                    <option key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="mb-5">
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${muted}`}>
                Description (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy order"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${inputCls}`}
              />
            </div>

            {/* Error */}
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{modalError}</p>
              </div>
            )}

            {/* Success */}
            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-emerald-700 text-sm">{modalSuccess}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={modal === "deposit" ? handleRazorpayDeposit : handleModalSubmit}
              disabled={modalLoading}
              className={`w-full py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${modal === "withdraw"
                ? "bg-red-500 hover:bg-red-600"
                : modal === "transfer"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
                }`}
            >
              {modalLoading
                ? "Processing..."
                : modal === "deposit" ? "Pay with Razorpay"  // ← updated label
                  : modal === "withdraw" ? "Confirm Withdraw"
                    : "Confirm Transfer"
              }
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
