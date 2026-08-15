import React from "react";
import { Link } from "react-router-dom";
import { Compass, Map, Heart, MessageSquare, ShieldCheck, Footprints } from "lucide-react";

export default function About() {
  return (
    <div className="container" style={{ paddingBottom: "80px" }}>
      <div className="about-hero">
        <h1>About TrailExplorer</h1>
        <p>
          TrailExplorer is a hiking trail discovery platform that helps users discover, explore and save hiking trails. Whether you are a beginner looking for a scenic weekend stroll or an experienced trekker scaling the highest Sahyadri peaks, we provide the insights you need.
        </p>
      </div>

      {/* 4 Feature Cards */}
      <div className="about-features-grid">
        <div className="about-feature-card">
          <div className="about-feature-icon">
            <Compass size={28} />
          </div>
          <h3>Discover Trails</h3>
          <p>
            Filter trails by difficulty level, distance range, and elevation to match your fitness and schedule.
          </p>
        </div>

        <div className="about-feature-card">
          <div className="about-feature-icon">
            <Map size={28} />
          </div>
          <h3>Explore on Map</h3>
          <p>
            Interactive OpenStreetMap integration lets you visualize trailheads, elevation markers, and your current GPS position.
          </p>
        </div>

        <div className="about-feature-card">
          <div className="about-feature-icon">
            <Heart size={28} />
          </div>
          <h3>Save Favorites</h3>
          <p>
            Bookmark dream treks with one click to plan upcoming weekend adventures with friends and family.
          </p>
        </div>

        <div className="about-feature-card">
          <div className="about-feature-icon">
            <MessageSquare size={28} />
          </div>
          <h3>Share Reviews</h3>
          <p>
            Read honest trail conditions and post your own reviews and tips to guide the hiking community.
          </p>
        </div>
      </div>

      {/* Safety & Responsible Trekking Banner */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "40px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
          alignItems: "center"
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "0.88rem",
              marginBottom: "8px"
            }}
          >
            <ShieldCheck size={18} /> Responsible Trekking
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "14px", color: "var(--text-main)" }}>
            Leave No Trace, Take Only Memories
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "20px" }}>
            We strongly advocate for preserving our natural forts, heritage structures, and pristine Western Ghats biodiversity. Always carry your plastic trash back, stay on designated paths, and respect local communities.
          </p>
          <Link to="/explore" className="btn btn-primary">
            Find Your Next Adventure
          </Link>
        </div>

        <div
          style={{
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            maxHeight: "260px"
          }}
        >
          <img
            src="/images/rajgad.png"
            alt="Preserve Trails"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  );
}
