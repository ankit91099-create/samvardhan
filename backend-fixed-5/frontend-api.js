/**
 * frontend-api.js (copy to src/services/api.js in your React project)
 * Updated for Razorpay payment integration.
 *
 * Usage for payment:
 *   import { paymentAPI } from "./services/api";
 *
 *   const { orderId, keyId, amount } = await paymentAPI.createOrder({
 *     amount: 500, name: "Ankit Kumar", phone: "9876543210",
 *     email: "ankit@example.com", service: "speech_therapy"
 *   });
 *
 *   // Open Razorpay checkout
 *   const rzp = new window.Razorpay({
 *     key: keyId, amount, currency: "INR",
 *     order_id: orderId, name: "Samvardhan Bloom",
 *     handler: async (response) => {
 *       await paymentAPI.verify({ ...response });
 *     }
 *   });
 *   rzp.open();
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken    = () => localStorage.getItem("accessToken");
export const setToken    = (t) => localStorage.setItem("accessToken", t);
export const removeToken = () => localStorage.removeItem("accessToken");

// ── Core fetch wrapper ─────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  failedQueue = [];
};

const request = async (endpoint, options = {}, retry = true) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options, headers, credentials: "include",
  });

  if (response.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); })
        .then(() => request(endpoint, options, false));
    }
    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!refreshRes.ok) throw new Error("Refresh failed");
      const data = await refreshRes.json();
      setToken(data.data.accessToken);
      processQueue(null, data.data.accessToken);
      return request(endpoint, options, false);
    } catch (err) {
      processQueue(err, null);
      removeToken();
      window.location.href = "/admin/login";
      throw err;
    } finally {
      isRefreshing = false;
    }
  }
  return response;
};

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const res = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    setToken(data.data.accessToken);
    return data;
  },
  logout: async () => {
    try { await request("/auth/logout", { method: "POST" }); } finally { removeToken(); }
  },
  getProfile: async () => {
    const res = await request("/auth/me");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await request("/auth/change-password", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
};

// ── Bookings API ───────────────────────────────────────────────────────────────
export const bookingAPI = {
  submit: async (formData) => {
    const res = await fetch(`${BASE_URL}/bookings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Booking failed");
    return data;
  },
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await request(`/admin/bookings${qs ? "?" + qs : ""}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
  getStats: async () => {
    const res = await request("/admin/bookings/stats");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
  update: async (id, updates) => {
    const res = await request(`/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
  delete: async (id) => {
    const res = await request(`/admin/bookings/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
};

// ── Payment API ────────────────────────────────────────────────────────────────
export const paymentAPI = {
  /**
   * Create a Razorpay order. Returns { orderId, keyId, amount, paymentId, name, email, phone }
   */
  createOrder: async ({ amount, name, phone, email, service, bookingId }) => {
    const res = await fetch(`${BASE_URL}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, name, phone, email, service, bookingId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create payment order");
    return data.data;
  },

  /**
   * Verify payment after Razorpay checkout succeeds.
   * Pass the response object from Razorpay handler directly.
   */
  verify: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId }) => {
    const res = await fetch(`${BASE_URL}/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Payment verification failed");
    return data.data;
  },

  // Admin operations
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await request(`/admin/payments${qs ? "?" + qs : ""}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
  getStats: async () => {
    const res = await request("/admin/payments/stats");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
  create: async (paymentData) => {
    const res = await request("/admin/payments", { method: "POST", body: JSON.stringify(paymentData) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
  update: async (id, updates) => {
    const res = await request(`/admin/payments/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
};
