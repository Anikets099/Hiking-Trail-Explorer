import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const success = await register(name, email, password);
      if (success) {
        navigate("/profile");
      }
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-split-card">
        {/* Left Image Side */}
        <div
          className="auth-image-side"
          style={{
            backgroundImage: `url('/images/register.png')`
          }}
        />

        {/* Right Form Side */}
        <div className="auth-form-side">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join TrailExplorer today</p>
          </div>

          {errorMsg && (
            <div
              style={{
                backgroundColor: "var(--badge-hard-bg)",
                color: "var(--badge-hard-text)",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                marginBottom: "16px",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: "12px" }}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
