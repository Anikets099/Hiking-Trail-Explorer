import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("aniketpatil@gmail.com");
  const [password, setPassword] = useState("User@12345");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/profile");
      } else {
        setErrorMsg("Invalid email or password.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Invalid email or password.");
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
            backgroundImage: `url('/images/login.png')`
          }}
        />

        {/* Right Form Side */}
        <div className="auth-form-side">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Log in to continue</p>
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
              <div className="form-help-row">
                <a
                  href="#forgot"
                  className="form-link"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Demo accounts:\nUser: aniketpatil@gmail.com / User@12345\nAdmin: admin@trailexplorer.com / Admin@12345");
                  }}
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: "12px" }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
