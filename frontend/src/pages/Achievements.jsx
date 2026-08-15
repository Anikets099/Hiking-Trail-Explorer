import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { completionService } from "../services/completionService";
import defaultTrailImage from "../assets/default-trail.jpg";
import {
  Award,
  CheckCircle,
  Lock,
  Compass,
  Calendar,
  MapPin,
  Ruler,
  Mountain,
  Trash2,
  Sparkles
} from "lucide-react";

export default function Achievements() {
  const { user } = useAuth();
  const [completedTrails, setCompletedTrails] = useState([]);
  const [badges, setBadges] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await completionService.getCompletions();
      if (res.success) {
        setCompletedTrails(res.data || []);
        setBadges(res.badges || []);
        setTotalCompleted(res.totalCompleted ?? res.data?.length ?? 0);
      }
    } catch (err) {
      console.warn("Failed to load achievements:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  const handleRemove = async (trailId) => {
    try {
      await completionService.removeCompletion(trailId);
      setCompletedTrails((prev) => prev.filter((t) => t.trailId !== trailId && t.id !== trailId && t._id !== trailId));
      setTotalCompleted((prev) => Math.max(0, prev - 1));
      fetchAchievements();
    } catch (e) {
      console.warn("Failed to remove completion:", e);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}
        >
          <Award size={32} />
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>
          Login to Track Your Trail Achievements
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
          Mark trails as completed, unlock adventure badges, and build your hiking history.
        </p>
        <Link to="/login" className="btn btn-primary">
          Log In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: "60px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(46, 125, 50, 0.12)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px"
            }}
          >
            🏆
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: "1.75rem" }}>
              My Achievements
            </h1>
            <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: "0.92rem" }}>
              Track completed trails, milestones, and outdoor adventure badges
            </p>
          </div>
        </div>
      </div>

      {/* Hero Stats Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
          borderRadius: "var(--radius-lg)",
          padding: "28px 32px",
          color: "#ffffff",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "32px",
          boxShadow: "0 8px 24px rgba(46, 125, 50, 0.2)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", opacity: 0.9, fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <Sparkles size={16} /> Adventurer Status
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, margin: "6px 0" }}>
            {totalCompleted} {totalCompleted === 1 ? "Trail" : "Trails"} Completed
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "0.95rem" }}>
            {totalCompleted >= 50
              ? "👑 You have reached Legendary Explorer status!"
              : totalCompleted >= 25
              ? "🔥 You are an Adventure Master! Keep exploring!"
              : totalCompleted >= 10
              ? "🏔️ Mountain Trekker status achieved! Next milestone: 25 trails."
              : totalCompleted >= 5
              ? "🌄 Explorer status unlocked! Next milestone: 10 trails."
              : totalCompleted >= 1
              ? "🥾 First adventure in the books! Complete 5 trails to unlock Explorer."
              : "Mark your first completed trail to unlock the 'First Adventure' badge!"}
          </p>
        </div>

        <Link
          to="/explore"
          className="btn"
          style={{
            backgroundColor: "#ffffff",
            color: "#1b5e20",
            fontWeight: 700,
            padding: "12px 24px",
            borderRadius: "var(--radius-md)"
          }}
        >
          <Compass size={18} /> Explore More Trails
        </Link>
      </div>

      {/* Achievement Badges Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🎖️</span> Adventure Badges
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px"
          }}
        >
          {badges.map((badge) => {
            const isUnlocked = badge.unlocked;
            return (
              <div
                key={badge.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: isUnlocked ? "2px solid #2e7d32" : "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 16px",
                  textAlign: "center",
                  position: "relative",
                  boxShadow: isUnlocked ? "0 4px 16px rgba(46, 125, 50, 0.12)" : "none",
                  opacity: isUnlocked ? 1 : 0.72,
                  transition: "var(--transition)"
                }}
              >
                {isUnlocked ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      backgroundColor: "rgba(46, 125, 50, 0.12)",
                      color: "var(--primary)",
                      borderRadius: "12px",
                      padding: "2px 8px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <CheckCircle size={12} /> Unlocked
                  </div>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <Lock size={14} />
                  </div>
                )}

                <div
                  style={{
                    fontSize: "36px",
                    margin: "6px auto 10px",
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: isUnlocked ? "rgba(46, 125, 50, 0.08)" : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {badge.icon}
                </div>

                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: isUnlocked ? "#1b5e20" : "var(--text-main)", marginBottom: "4px" }}>
                  {badge.title}
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px", minHeight: "36px" }}>
                  {badge.description}
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
                  <div
                    style={{
                      width: `${badge.progressPercent}%`,
                      height: "100%",
                      backgroundColor: isUnlocked ? "#2e7d32" : "#94a3b8",
                      borderRadius: "3px",
                      transition: "width 0.4s ease"
                    }}
                  />
                </div>

                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  {badge.progress} / {badge.requiredCount} completed
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Trails List */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✓</span> Completed Trails ({completedTrails.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                display: "inline-block",
                width: "32px",
                height: "32px",
                border: "3px solid rgba(46, 125, 50, 0.2)",
                borderTopColor: "var(--primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                marginBottom: "12px"
              }}
            />
            <p style={{ color: "var(--text-muted)" }}>Loading achievements...</p>
          </div>
        ) : completedTrails.length > 0 ? (
          <div className="trails-grid trails-grid-4">
            {completedTrails.map((trail) => {
              const linkId = trail.slug || trail.trailId || trail.id || trail._id;
              const destUrl = `/trail/${linkId}?name=${encodeURIComponent(trail.trailName || trail.name || '')}&city=${encodeURIComponent(trail.city || '')}`;

              return (
                <div key={trail._id || trail.id} className="trail-card">
                  <div className="trail-card-image-wrap">
                    <img
                      src={trail.trailImage || trail.imageUrl || trail.image || defaultTrailImage}
                      alt={trail.trailName || trail.name}
                      className="trail-card-image"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultTrailImage;
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                      }}
                    >
                      <CheckCircle size={13} /> Completed
                    </div>
                  </div>

                  <div className="trail-card-body">
                    <h3 className="trail-card-title" title={trail.trailName || trail.name}>
                      <Link to={destUrl}>{trail.trailName || trail.name}</Link>
                    </h3>

                    {/* Location */}
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginBottom: "8px"
                      }}
                    >
                      <MapPin size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Located in {trail.location || "India"}
                      </span>
                    </div>

                    {/* Completion Date */}
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--primary)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        marginBottom: "12px"
                      }}
                    >
                      <Calendar size={13} />
                      <span>Completed: {formatDate(trail.completedAt)}</span>
                    </div>

                    <div className="trail-card-actions">
                      <Link to={destUrl} className="btn btn-outline btn-sm btn-block" style={{ fontWeight: 600 }}>
                        View Details
                      </Link>
                      <button
                        onClick={() => handleRemove(trail.trailId || trail.id || trail._id)}
                        className="btn btn-danger btn-sm"
                        title="Remove from completed"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)"
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px"
              }}
            >
              <Award size={32} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>
              No completed trails yet
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px", maxWidth: "460px", margin: "0 auto 24px" }}>
              When you hike a trail, visit its details page and click <strong>"🏆 Mark as Completed"</strong> to record your conquest!
            </p>
            <Link to="/explore" className="btn btn-primary">
              <Compass size={18} /> Explore Trails
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
