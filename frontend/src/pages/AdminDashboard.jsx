import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { trailService } from "../services/trailService";
import TrailFormModal from "../components/TrailFormModal";
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Users,
  MessageSquare,
  LogOut,
  Edit,
  Trash2,
  CheckCircle,
  Plus,
  ShieldAlert
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrail, setEditingTrail] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadTrails = async () => {
    setLoading(true);
    try {
      const res = await trailService.getAllTrails();
      if (res.success && res.data) {
        setTrails(res.data);
      }
    } catch (e) {
      console.warn("Failed to load trails in admin:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrails();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTrail(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trail) => {
    setEditingTrail(trail);
    setIsModalOpen(true);
  };

  const handleSaveTrail = async (formData) => {
    try {
      if (editingTrail) {
        const id = editingTrail._id || editingTrail.id;
        const res = await trailService.updateTrail(id, formData);
        if (res.success) {
          showNotification(`Trail "${formData.name}" updated successfully!`);
          loadTrails();
        }
      } else {
        const res = await trailService.createTrail(formData);
        if (res.success) {
          showNotification(`Trail "${formData.name}" added successfully!`);
          loadTrails();
        }
      }
    } catch (err) {
      alert(err.message || "Failed to save trail. Admin role required.");
    }
  };

  const handleDeleteTrail = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const res = await trailService.deleteTrail(id);
        if (res.success) {
          showNotification(`Trail "${name}" deleted.`);
          setTrails((prev) => prev.filter((t) => (t._id !== id && t.id !== id)));
        }
      } catch (err) {
        alert(err.message || "Failed to delete trail.");
      }
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDifficultyClass = (diff) => {
    const d = (diff || "").toLowerCase();
    if (d.includes("easy")) return "easy";
    if (d.includes("hard")) return "hard";
    return "moderate";
  };

  // Check admin role
  if (!user || user.role !== "admin") {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "var(--badge-hard-bg)",
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>
          Admin Privileges Required
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
          You must be logged in as an administrator to access the TrailExplorer Management Dashboard.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link to="/login" className="btn btn-primary">
            Admin Login
          </Link>
          <Link to="/" className="btn btn-secondary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Dark Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2e7d32"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
            <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" />
          </svg>
          Admin Dashboard
        </div>

        <ul className="admin-nav">
          <li
            className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </li>
          <li
            className={`admin-nav-item ${activeTab === "trails" ? "active" : ""}`}
            onClick={() => setActiveTab("trails")}
          >
            <Compass size={18} /> Trails
          </li>
          <li className="admin-nav-item" onClick={handleOpenAddModal}>
            <PlusCircle size={18} /> Add Trail
          </li>
          <li
            className={`admin-nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={18} /> Users
          </li>
          <li
            className={`admin-nav-item ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <MessageSquare size={18} /> Reviews
          </li>
          <li className="admin-nav-item logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        {/* Header with Title & Add Trail Action */}
        <div className="admin-header">
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)" }}>
            Admin Dashboard
          </h1>
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus size={18} /> Add Trail
          </button>
        </div>

        {notification && (
          <div
            style={{
              backgroundColor: "var(--badge-easy-bg)",
              color: "var(--badge-easy-text)",
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600
            }}
          >
            <CheckCircle size={18} /> {notification}
          </div>
        )}

        {/* 4 Summary Metric Cards matching Panel 9 */}
        <div className="admin-metrics-grid">
          <div className="metric-card">
            <div className="metric-card-label">Total Trails</div>
            <div className="metric-card-value">{trails.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">Total Users</div>
            <div className="metric-card-value">120</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">Total Reviews</div>
            <div className="metric-card-value">340</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">Total Favorites</div>
            <div className="metric-card-value">540</div>
          </div>
        </div>

        {/* Recent Trails / Trail Management Table */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h2 className="admin-table-title">Recent Trails</h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trail Name</th>
                  <th>Difficulty</th>
                  <th>Distance</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trails.map((trail) => (
                  <tr key={trail._id || trail.id || trail.slug}>
                    <td style={{ fontWeight: 600 }}>
                      <Link
                        to={`/trail/${trail.slug || trail._id}`}
                        style={{
                          color: "var(--text-main)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        {trail.name} ({trail.city})
                      </Link>
                    </td>
                    <td>
                      <span className={`badge-difficulty ${getDifficultyClass(trail.difficulty)}`}>
                        {trail.difficulty}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{trail.distance}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleOpenEditModal(trail)}
                          className="btn btn-outline btn-sm"
                          title="Edit Trail"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteTrail(trail._id || trail.id, trail.name)
                          }
                          className="btn btn-danger btn-sm"
                          title="Delete Trail"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Trail Modal */}
      <TrailFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTrail}
        editingTrail={editingTrail}
      />
    </div>
  );
}
