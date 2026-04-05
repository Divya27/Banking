// src/services/api.js
// All communication with Spring Boot backend
const BASE_URL = "http://localhost:8080/api";

// ============================================================
// HELPER — attaches JWT token to every request
// ============================================================
const getHeaders = () => ({
  "Content-Type": "application/json",
  ...(localStorage.getItem("token") && {
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  }),
});

// ============================================================
// AUTH
// ============================================================

// POST /api/auth/register → 201 no body
export const registerUser = async (username, email, password) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ username, email, password }),
  });
  return {
    success: response.status === 201,
    status: response.status,
  };
};

// POST /api/auth/login → { token }
export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return { success: false, status: response.status };
  const data = await response.json();
  return { success: true, token: data.token };
};

// ============================================================
// ACCOUNT
// ============================================================

// GET /api/accounts → [ { id, accountHolderName, balance, accountType, user } ]
export const getAllAccounts = async () => {
  const response = await fetch(`${BASE_URL}/accounts`, {
    method: "GET",
    headers: getHeaders(),
  });
  return response.json();
};

// GET /api/accounts/:id → { id, accountHolderName, balance, accountType, user }
export const getAccount = async (accountId) => {
  const response = await fetch(`${BASE_URL}/accounts/${accountId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return response.json();
};

// POST /api/accounts → { id, accountHolderName, balance, accountType }
export const createAccount = async (accountHolderName, balance, accountType) => {
  const response = await fetch(`${BASE_URL}/accounts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ accountHolderName, balance, accountType }),
  });
  return response.json();
};

// ============================================================
// TRANSACTIONS
// ============================================================

// GET /api/transactions?page=0&size=5
// Response: { content: [...], totalPages, totalElements }
export const getTransactions = async (page = 0, size = 5) => {
  const response = await fetch(`${BASE_URL}/transactions?page=${page}&size=${size}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return response.json();
};

// POST /api/accounts/:id/deposit
// Body: { amount, category, description }
export const deposit = async (accountId, amount, category, description) => {
  const response = await fetch(`${BASE_URL}/accounts/${accountId}/deposit`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ amount, category, description }),
  });
  return response.json();
};

// POST /api/accounts/:id/withdraw
// Body: { amount, category, description }
export const withdraw = async (accountId, amount, category, description) => {
  const response = await fetch(`${BASE_URL}/accounts/${accountId}/withdraw`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ amount, category, description }),
  });
  return response.json();
};

// POST /api/accounts/transfer
// Body: { fromAccountId, toAccountId, amount }
export const transfer = async (fromAccountId, toAccountId, amount) => {
  const response = await fetch(`${BASE_URL}/accounts/transfer`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fromAccountId, toAccountId, amount }),
  });
  return response.json();
};

// GET /api/user/me
// Returns { id, username, email, createdAt }
export const getMe = async () => {
  const response = await fetch(`${BASE_URL}/user/me`, {
    method: "GET",
    headers: getHeaders(),
  });
  return response.json();
};

// POST /api/auth/logout
// Blacklists the JWT token on Spring Boot side
export const logoutUser = async () => {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: getHeaders(),
  });
};

// GET /api/transactions/{accountId}?page=0&size=5
// Returns paginated transactions for a specific account
export const getTransactionsByAccountId = async (accountId, page = 0, size = 5) => {
  const response = await fetch(`${BASE_URL}/transactions/${accountId}?page=${page}&size=${size}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return response.json();
};

// ============================================================
// PAYMENT — Razorpay
// ============================================================

// POST /api/payment/create-order
// Step 1 — creates a Razorpay order on Spring Boot
// Returns { orderId, amount, currency, keyId }
export const createPaymentOrder = async (accountId, amount) => {
  const response = await fetch(`${BASE_URL}/payment/create-order`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      accountId,
      amount,
      currency: "INR",
    }),
  });
  return response.json();
};

// POST /api/payment/verify
// Step 2 — verifies payment after user completes Razorpay popup
// Also updates balance via deposit API on Spring Boot
export const verifyPayment = async (
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  accountId,
  amount,
  category,
  description
) => {
  const response = await fetch(`${BASE_URL}/payment/verify`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      accountId,
      amount,
      category,
      description,
    }),
  });
  return response.json();
};

// ============================================================
// GET /api/insights/{accountId}
// Spring Boot fetches transactions → calls Claude → returns insights
// Returns { insights: "...", status: "success|rate_limit|error|no_data|no_categories" }
// ============================================================
export const getAiInsights = async (accountId) => {
  const response = await fetch(`${BASE_URL}/insights/${accountId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return response.json();
};