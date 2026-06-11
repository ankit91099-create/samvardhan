import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingAPI, paymentAPI, authAPI } from "../services/api";
import "./admin.css";

const StatusBadge = ({ value }) => (
  <span className={`status status--${value}`}>{value}</span>
);

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-box">
      <p>{message}</p>
      <div className="modal-actions">
        <button className="btn danger" onClick={onConfirm}>Confirm</button>
        <button className="btn secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  </div>
);

const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg, setMsg]   = useState({ text: "", ok: false });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      setMsg({ text: "New password must be at least 6 characters.", ok: false });
      return;
    }
    if (form.newPassword !== form.confirm) {
      setMsg({ text: "Passwords do not match.", ok: false });
      return;
    }
    setBusy(true);
    try {
      await authAPI.changePassword(form.currentPassword, form.newPassword);
      setMsg({ text: "Password changed! You will be logged out.", ok: true });
      setTimeout(onClose, 2000);
    } catch (err) {
      setMsg({ text: err.message || "Failed to change password.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box--lg">
        <h3>Change Password</h3>
        {msg.text && (
          <div className={`modal-msg ${msg.ok ? "modal-msg--ok" : "modal-msg--err"}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={submit} className="modal-form">
          {[
            { key: "currentPassword", label: "Current Password" },
            { key: "newPassword",     label: "New Password" },
            { key: "confirm",         label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <div key={key} className="modal-field">
              <label>{label}</label>
              <input
                type="password"
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                required
                autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
              />
            </div>
          ))}
          <div className="modal-actions">
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Update Password"}
            </button>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Admin = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab,  setActiveTab]  = useState("bookings");
  const [bookings,   setBookings]   = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [pagination,    setPagination]    = useState({});
  const [confirm,     setConfirm]     = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 15 };
      if (bookingStatus) params.status = bookingStatus;
      if (search)        params.search  = search;

      const [bData, pData, sData] = await Promise.all([
        bookingAPI.getAll(params),
        paymentAPI.getAll({ page: 1, limit: 15 }),
        bookingAPI.getStats(),
      ]);

      setBookings(bData.bookings || []);
      setPagination(bData.pagination || {});
      setPayments(pData.payments || []);
      setStats(sData);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [page, bookingStatus, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLogout = () => {
    setConfirm({
      message: "Are you sure you want to logout?",
      onConfirm: async () => {
        setConfirm(null);
        await logout();
        navigate("/admin/login");
      },
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await bookingAPI.update(id, { status: newStatus });
      fetchAll();
    } catch (err) {
      setError("Failed to update status: " + err.message);
    }
  };

  const handleCancelBooking = (id) => {
    setConfirm({
      message: "Cancel this booking? The patient will need to re-book.",
      onConfirm: async () => {
        setConfirm(null);
        try {
          await bookingAPI.delete(id);
          fetchAll();
        } catch (err) {
          setError("Failed to cancel booking: " + err.message);
        }
      },
    });
  };

  const handleExport = () => {
    const rows = [
      ["Name", "Age", "Phone", "Service", "Status", "Date"],
      ...bookings.map((b) => [
        `"${b.name}"`, b.age, b.phone,
        `"${b.service}"`, b.status,
        new Date(b.createdAt).toLocaleDateString("en-IN"),
      ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-wrapper">

      {confirm    && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}

      <div className="admin-header">
        <div className="admin-title">
          <h1>📊 Admin Dashboard</h1>
          {admin && (
            <span className="admin-user">
              👤 {admin.name} <span className="role-badge">{admin.role}</span>
            </span>
          )}
        </div>
        <div className="header-buttons">
          <button className="btn primary" onClick={fetchAll} disabled={loading}>
            {loading ? "⏳" : "🔄"} Refresh
          </button>
          <button className="btn secondary" onClick={handleExport}>
            📥 Export CSV
          </button>
          <button className="btn secondary" onClick={() => setShowPwModal(true)}>
            🔑 Password
          </button>
          <button className="btn danger" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => { setError(""); fetchAll(); }}>Retry</button>
        </div>
      )}

      {stats && (
        <div className="grid">
          {[
            { label: "Total Bookings", value: stats.total,     icon: "📋" },
            { label: "Pending",        value: stats.pending,   icon: "🕐" },
            { label: "Confirmed",      value: stats.confirmed, icon: "✅" },
            { label: "Completed",      value: stats.completed, icon: "🏁" },
            { label: "Last 7 Days",    value: stats.last7Days, icon: "📅" },
            { label: "Total Payments", value: payments.length, icon: "💳" },
          ].map((s) => (
            <div className="card" key={s.label}>
              <div className="card-icon">{s.icon}</div>
              <h3>{s.label}</h3>
              <p className="card-value">{s.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="tab-buttons">
        <button
          className={`tab ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          📋 Bookings
        </button>
        <button
          className={`tab ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          💳 Payments
        </button>
      </div>

      {activeTab === "bookings" && (
        <div className="box">
          <div className="box-header">
            <h2>Booking Records</h2>
            <div className="filters">
              <input
                className="filter-input"
                placeholder="🔍 Search name / phone"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              <select
                className="filter-select"
                value={bookingStatus}
                onChange={(e) => { setBookingStatus(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-row">Loading bookings…</div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Phone</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-row">No bookings found</td>
                      </tr>
                    ) : (
                      bookings.map((b, i) => (
                        <tr key={b._id}>
                          <td className="row-num">{(page - 1) * 15 + i + 1}</td>
                          <td className="name-cell">{b.name}</td>
                          <td>{b.age}</td>
                          <td>
                            <a href={`tel:${b.phone}`} className="phone-link">{b.phone}</a>
                          </td>
                          <td>
                            <span className="service-tag">
                              {b.service?.replace(/_/g, " ") || "—"}
                            </span>
                          </td>
                          <td>
                            <select
                              className={`status-select status-select--${b.status}`}
                              value={b.status}
                              onChange={(e) => handleStatusChange(b._id, e.target.value)}
                            >
                              <option value="pending">pending</option>
                              <option value="confirmed">confirmed</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                          </td>
                          <td className="date-cell">
                            {new Date(b.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          <td>
                            <div className="action-btns">
                              <button
                                className="btn-sm btn-sm--warn"
                                title="Cancel booking"
                                onClick={() => handleCancelBooking(b._id)}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="page-info">
                    Page {pagination.page} of {pagination.totalPages}
                    &nbsp;({pagination.total} total)
                  </span>
                  <button
                    className="page-btn"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="box">
          <div className="box-header">
            <h2>Payment Records</h2>
          </div>
          {loading ? (
            <div className="loading-row">Loading payments…</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">No payment records found</td>
                    </tr>
                  ) : (
                    payments.map((p, i) => (
                      <tr key={p._id}>
                        <td className="row-num">{i + 1}</td>
                        <td className="name-cell">{p.name}</td>
                        <td className="amount-cell">₹{p.amount?.toLocaleString("en-IN")}</td>
                        <td>{p.method || "—"}</td>
                        <td><StatusBadge value={p.status} /></td>
                        <td className="date-cell">
                          {new Date(p.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Admin;
