// api.js — Samvardhan Bloom Frontend API Service
// VITE_API_URL is set in .env before running npm run build

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Token storage
export const getToken    = ()    => localStorage.getItem("accessToken");
export const setToken    = (t)   => localStorage.setItem("accessToken", t);
export const removeToken = ()    => localStorage.removeItem("accessToken");

// Core request wrapper with automatic JWT refresh
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
};

const request = async (endpoint, options = {}, retry = true) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => request(endpoint, options, false));
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

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

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    setToken(data.data.accessToken);
    return data.data;
  },

  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      removeToken();
    }
  },

  getProfile: async () => {
    const res = await request("/auth/me");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await request("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
};

// Bookings API
export const bookingAPI = {
  // Public — no auth needed
  submit: async (formData) => {
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Booking failed");
    return data;
  },

  // Admin — requires JWT
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
    const res = await request(`/admin/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
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

// Payments API
export const paymentAPI = {
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

  update: async (id, updates) => {
    const res = await request(`/admin/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
};
