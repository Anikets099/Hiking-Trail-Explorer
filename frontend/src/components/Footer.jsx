import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>
              <svg
                width="24"
                height="24"
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
              TrailExplorer
            </h3>
            <p>
              Your ultimate guide to discovering, exploring, and sharing scenic hiking trails and historical fort treks in Maharashtra and beyond.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/explore">Explore Trails</Link></li>
              <li><Link to="/map">Interactive Map</Link></li>
              <li><Link to="/favorites">My Favorites</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Popular Treks</h4>
            <ul>
              <li><Link to="/trail/rajgad-fort">Rajgad Fort Trek</Link></li>
              <li><Link to="/trail/sinhagad-fort">Sinhagad Fort Trek</Link></li>
              <li><Link to="/trail/torna-fort">Torna Fort Trek</Link></li>
              <li><Link to="/trail/lohagad-fort">Lohagad Fort Trek</Link></li>
              <li><Link to="/trail/kalsubai-peak">Kalsubai Peak</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Account & Safety</h4>
            <ul>
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/admin">Admin Dashboard</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/about">Trekking Safety Tips</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} TrailExplorer. All rights reserved.</div>
          <div>Built for trekking lovers & outdoor enthusiasts.</div>
        </div>
      </div>
    </footer>
  );
}
