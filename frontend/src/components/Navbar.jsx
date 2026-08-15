import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Trees, Menu, X, User, Shield, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo-icon">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2e7d32"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
              <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" />
            </svg>
          </span>
          <span>TrailExplorer</span>
        </Link>

        {/* Desktop & Mobile Navigation Links */}
        <nav className={`navbar-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <div className="nav-item">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
          </div>
          <div className="nav-item">
            <NavLink
              to="/explore"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </NavLink>
          </div>
          <div className="nav-item">
            <NavLink
              to="/map"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Map
            </NavLink>
          </div>
          <div className="nav-item">
            <NavLink
              to="/favorites"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Favorites
            </NavLink>
          </div>
          <div className="nav-item">
            <NavLink
              to="/about"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </NavLink>
          </div>
        </nav>

        {/* Right Auth Area */}
        <div className="navbar-auth">
          {user ? (
            <div style={{ position: "relative" }}>
              <div
                className="navbar-user-avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={user.name}
              >
                <img
                  src={user.avatar || "/images/avatar.png"}
                  alt={user.name}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";
                  }}
                />
              </div>

              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    width: "200px",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-lg)",
                    padding: "8px 0",
                    zIndex: 1100
                  }}
                >
                  <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{user.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      fontSize: "0.88rem",
                      color: "var(--text-main)",
                      transition: "var(--transition)"
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <Link
                    to="/achievements"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      fontSize: "0.88rem",
                      color: "var(--text-main)",
                      transition: "var(--transition)"
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span style={{ fontSize: "16px" }}>🏆</span> Achievements
                  </Link>
                  <Link
                    to="/admin"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 16px",
                      fontSize: "0.88rem",
                      color: "var(--text-main)",
                      transition: "var(--transition)"
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Shield size={16} /> Admin Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: "0.88rem",
                      color: "var(--danger)",
                      textAlign: "left",
                      borderTop: "1px solid var(--border-light)",
                      marginTop: "4px"
                    }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
