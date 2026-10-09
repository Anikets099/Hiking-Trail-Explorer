import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTrails } from "../context/TrailContext";
import { favoriteService } from "../services/favoriteService";
import { userService } from "../services/userService";
import { completionService } from "../services/completionService";
import TrailCard from "../components/TrailCard";
import defaultTrailImage from "../assets/default-trail.jpg";
import {
  User,
  Heart,
  MessageSquare,
  Settings,
  Compass,
  Edit3,
  LogOut,
  Save,
  CheckCircle,
  Camera,
  Trash2,
  Upload,
  ArrowLeft,
  Star,
  Calendar,
  MapPin,
  Ruler,
  Mountain,
  Clock,
  ExternalLink,
  Award,
  Lock,
  Sparkles
} from "lucide-react";

export default function Profile() {
  const { user, updateProfile, uploadProfilePhoto, deleteProfilePhoto, logout } = useAuth();
  const { removeFavorite } = useTrails();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Live data lists from MongoDB
  const [favoriteTrails, setFavoriteTrails] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [exploredTrails, setExploredTrails] = useState([]);
  const [completedTrails, setCompletedTrails] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Profile counts from MongoDB
  const [profileStats, setProfileStats] = useState({
    favoritesCount: 0,
    reviewsCount: 0,
    trailsExplored: 0,
    completionsCount: 0
  });

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditBio(user.bio || "");
    }
  }, [user]);

  // Fetch live counts from MongoDB
  const fetchProfileStats = async () => {
    if (!user) return;
    try {
      const res = await userService.getUserProfile();
      if (res.success && res.data) {
        setProfileStats({
          favoritesCount: res.data.favoritesCount ?? 0,
          reviewsCount: res.data.reviewsCount ?? 0,
          trailsExplored: res.data.trailsExplored ?? 0,
          completionsCount: res.data.completionsCount ?? 0
        });
      }
    } catch (e) {
      setProfileStats({
        favoritesCount: user.favoritesCount ?? 0,
        reviewsCount: user.reviewsCount ?? 0,
        trailsExplored: user.trailsExplored ?? 0,
        completionsCount: 0
      });
    }
  };

  useEffect(() => {
    fetchProfileStats();
  }, [user, activeTab]);

  // Load specific tab data from MongoDB on tab activation
  useEffect(() => {
    const loadTabData = async () => {
      if (!user) return;

      if (activeTab === "favorites") {
        setLoadingData(true);
        try {
          const res = await favoriteService.getFavorites();
          if (res.success && res.data) {
            setFavoriteTrails(res.data);
            setProfileStats((prev) => ({ ...prev, favoritesCount: res.data.length }));
          }
        } catch (e) {}
        setLoadingData(false);
      } else if (activeTab === "reviews") {
        setLoadingData(true);
        try {
          const res = await userService.getUserReviews();
          if (res.success && res.data) {
            setUserReviews(res.data);
            setProfileStats((prev) => ({ ...prev, reviewsCount: res.data.length }));
          }
        } catch (e) {}
        setLoadingData(false);
      } else if (activeTab === "explored") {
        setLoadingData(true);
        try {
          const res = await userService.getExploredTrails();
          if (res.success && res.data) {
            setExploredTrails(res.data);
            setProfileStats((prev) => ({ ...prev, trailsExplored: res.data.length }));
          }
        } catch (e) {}
        setLoadingData(false);
      } else if (activeTab === "achievements") {
        setLoadingData(true);
        try {
          const res = await completionService.getCompletions();
          if (res.success) {
            setCompletedTrails(res.data || []);
            setBadges(res.badges || []);
            setProfileStats((prev) => ({ ...prev, completionsCount: res.totalCompleted ?? res.data?.length ?? 0 }));
          }
        } catch (e) {}
        setLoadingData(false);
      }
    };

    loadTabData();
  }, [user, activeTab]);


  if (!user) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>You are not logged in</h2>
        <p style={{ color: "var(--text-muted)", margin: "16px 0 24px" }}>
          Please login to view and manage your profile.
        </p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const success = await updateProfile({
      name: editName,
      bio: editBio
    });
    if (success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadProfilePhoto(file);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(res.message || "Failed to upload profile image.");
      }
    } catch (err) {
      alert(err.message || "Failed to upload photo");
    }
    setUploading(false);
  };

  const handleRemovePhoto = async () => {
    if (window.confirm("Revert profile photo to default avatar?")) {
      await deleteProfilePhoto();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDifficultyClass = (diff) => {
    const d = (diff || "").toLowerCase();
    if (d.includes("easy")) return "easy";
    if (d.includes("hard")) return "hard";
    return "moderate";
  };

  return (
    <div className="container">
      <div className="profile-layout">
        {/* Left Profile Navigation */}
        <div className="profile-sidebar">
          <ul className="profile-nav-list">
            <li
              className={`profile-nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} /> Profile
            </li>
            <li
              className={`profile-nav-item ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => setActiveTab("favorites")}
            >
              <Heart size={18} /> My Favorites ({profileStats.favoritesCount ?? 0})
            </li>
            <li
              className={`profile-nav-item ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              <MessageSquare size={18} /> My Reviews ({profileStats.reviewsCount ?? 0})
            </li>
            <li
              className={`profile-nav-item ${activeTab === "explored" ? "active" : ""}`}
              onClick={() => setActiveTab("explored")}
            >
              <Compass size={18} /> Trails Explored ({profileStats.trailsExplored ?? 0})
            </li>
            <li
              className={`profile-nav-item ${activeTab === "achievements" ? "active" : ""}`}
              onClick={() => setActiveTab("achievements")}
            >
              <Award size={18} /> 🏆 Achievements ({profileStats.completionsCount ?? 0})
            </li>
            <li
              className={`profile-nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={18} /> Settings
            </li>
          </ul>
        </div>

        {/* Right Profile Content */}
        <div>
          {/* TAB 1: Main Profile View with Clickable Cards */}
          {activeTab === "profile" && (
            <div className="profile-card">
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "24px" }}>
                My Profile
              </h2>

              {saveSuccess && (
                <div
                  style={{
                    backgroundColor: "var(--badge-easy-bg)",
                    color: "var(--badge-easy-text)",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 600
                  }}
                >
                  <CheckCircle size={18} /> Profile updated successfully!
                </div>
              )}

              {/* User Header & Photo Upload Area */}
              <div className="profile-user-header" style={{ alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <div className="profile-user-avatar">
                    <img
                      src={user.avatar || "/images/avatar.png"}
                      alt={user.name}
                      onError={(e) => {
                        e.target.src = "/images/avatar.png";
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #ffffff",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                    }}
                    title="Upload profile picture"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>

                <div className="profile-user-info">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  {user.bio && <p style={{ color: "var(--text-main)", marginTop: "6px", fontSize: "0.9rem" }}>{user.bio}</p>}

                  <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn btn-outline btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Upload size={14} /> {uploading ? "Uploading..." : "Upload Photo"}
                    </button>
                    {user.profileImage && user.profileImage.startsWith('/uploads/') && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="btn btn-danger btn-sm"
                        title="Revert to default avatar"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Clickable Statistics Cards */}
              <div className="profile-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "14px" }}>
                <div
                  className="profile-stat-box"
                  onClick={() => setActiveTab("favorites")}
                  title="Click to view all saved favorites"
                  style={{ cursor: "pointer" }}
                >
                  <div className="profile-stat-icon-wrap">
                    <Heart size={22} fill="var(--primary)" />
                  </div>
                  <div className="profile-stat-details">
                    <span>Favorites</span>
                    <h4>{profileStats.favoritesCount ?? 0}</h4>
                  </div>
                </div>

                <div
                  className="profile-stat-box"
                  onClick={() => setActiveTab("reviews")}
                  title="Click to view all your reviews"
                  style={{ cursor: "pointer" }}
                >
                  <div className="profile-stat-icon-wrap">
                    <MessageSquare size={22} />
                  </div>
                  <div className="profile-stat-details">
                    <span>Reviews</span>
                    <h4>{profileStats.reviewsCount ?? 0}</h4>
                  </div>
                </div>

                <div
                  className="profile-stat-box"
                  onClick={() => setActiveTab("explored")}
                  title="Click to view all explored trails"
                  style={{ cursor: "pointer" }}
                >
                  <div className="profile-stat-icon-wrap">
                    <Compass size={22} />
                  </div>
                  <div className="profile-stat-details">
                    <span>Explored</span>
                    <h4>{profileStats.trailsExplored ?? 0}</h4>
                  </div>
                </div>

                <div
                  className="profile-stat-box"
                  onClick={() => setActiveTab("achievements")}
                  title="Click to view your achievements & completed trails"
                  style={{ cursor: "pointer" }}
                >
                  <div className="profile-stat-icon-wrap" style={{ backgroundColor: "rgba(46, 125, 50, 0.12)", color: "var(--primary)" }}>
                    <Award size={22} />
                  </div>
                  <div className="profile-stat-details">
                    <span>Completed</span>
                    <h4>{profileStats.completionsCount ?? 0}</h4>
                  </div>
                </div>
              </div>


              {/* Edit Profile Form / Button */}
              {!isEditing ? (
                <div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary btn-block btn-lg"
                  >
                    <Edit3 size={18} /> Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} style={{ borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>
                    Edit Profile Information
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio / About Me</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      value={editBio}
                      placeholder="Share a short bio about your hiking adventures..."
                      onChange={(e) => setEditBio(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Save size={18} /> Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Favorites Detailed View */}
          {activeTab === "favorites" && (
            <div className="profile-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowLeft size={16} /> Back to Profile
                </button>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {favoriteTrails.length} saved {favoriteTrails.length === 1 ? 'trail' : 'trails'}
                </span>
              </div>

              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "20px" }}>
                My Saved Favorites
              </h2>

              {loadingData ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading your favorites...
                </div>
              ) : favoriteTrails.length > 0 ? (
                <div className="trails-grid trails-grid-3">
                  {favoriteTrails.map((trail) => (
                    <TrailCard
                      key={trail._id || trail.slug || trail.id}
                      trail={trail}
                      showRemoveBtn
                      onRemove={async (id, trail) => {
                        await removeFavorite(id, trail);
                        setFavoriteTrails((prev) => {
                          const updated = prev.filter((t) => t._id !== id && t.slug !== id);
                          setProfileStats((s) => ({ ...s, favoritesCount: updated.length }));
                          return updated;
                        });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ padding: "32px 20px", textAlign: "center", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                  <Heart size={36} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "16px", fontWeight: 500 }}>
                    You haven't added any trails to Favorites yet.
                  </p>
                  <Link to="/explore" className="btn btn-primary btn-sm">
                    Discover Trails to Favorite
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Reviews Detailed View */}
          {activeTab === "reviews" && (
            <div className="profile-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowLeft size={16} /> Back to Profile
                </button>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {userReviews.length} {userReviews.length === 1 ? 'review' : 'reviews'} written
                </span>
              </div>

              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "20px" }}>
                My Trail Reviews
              </h2>

              {loadingData ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading your reviews...
                </div>
              ) : userReviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {userReviews.map((rev) => {
                    const trail = rev.trail;
                    const trailName = trail?.name || "Hiking Trail";
                    const trailImage = trail?.imageUrl || trail?.image || defaultTrailImage;
                    const trailUrl = trail ? `/trail/${trail.slug || trail.id || trail._id}` : "/explore";

                    return (
                      <div
                        key={rev._id}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "16px",
                          backgroundColor: "var(--bg-main)",
                          display: "flex",
                          gap: "16px",
                          alignItems: "flex-start"
                        }}
                      >
                        {/* Trail Thumbnail */}
                        <img
                          src={trailImage}
                          alt={trailName}
                          style={{
                            width: "90px",
                            height: "90px",
                            borderRadius: "var(--radius-sm)",
                            objectFit: "cover",
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = defaultTrailImage;
                          }}
                        />

                        {/* Review Information */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                            <div>
                              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                                <Link to={trailUrl} style={{ color: "var(--text-main)", textDecoration: "none" }}>
                                  {trailName}
                                </Link>
                              </h3>
                              {trail?.location && (
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  📍 {trail.location}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={15}
                                  fill={i < rev.rating ? "var(--star)" : "none"}
                                  style={{ color: i < rev.rating ? "var(--star)" : "#cbd5e1" }}
                                />
                              ))}
                            </div>
                          </div>

                          <p style={{ fontSize: "0.92rem", color: "var(--text-main)", margin: "8px 0 10px 0", lineHeight: 1.5 }}>
                            "{rev.comment}"
                          </p>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Calendar size={13} />
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently"}
                            </span>
                            <Link to={trailUrl} className="btn btn-outline btn-sm" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>
                              View Trail <ExternalLink size={12} style={{ marginLeft: "4px" }} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "32px 20px", textAlign: "center", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                  <MessageSquare size={36} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "16px", fontWeight: 500 }}>
                    You haven't written any reviews yet.
                  </p>
                  <Link to="/explore" className="btn btn-primary btn-sm">
                    Explore Trails & Share Your Experience
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Trails Explored Detailed View */}
          {activeTab === "explored" && (
            <div className="profile-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowLeft size={16} /> Back to Profile
                </button>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {exploredTrails.length} {exploredTrails.length === 1 ? 'trail' : 'trails'} explored
                </span>
              </div>

              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "20px" }}>
                Trails Explored
              </h2>

              {loadingData ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading your explored trails...
                </div>
              ) : exploredTrails.length > 0 ? (
                <div className="trails-grid trails-grid-3">
                  {exploredTrails.map((trail) => {
                    const destinationUrl = `/trail/${trail.slug || trail.id || trail._id}?name=${encodeURIComponent(trail.name || '')}&city=${encodeURIComponent(trail.city || '')}`;
                    const imgUrl = trail.imageUrl || trail.image || defaultTrailImage;

                    return (
                      <div key={trail._id || trail.slug || trail.id} className="trail-card">
                        <div className="trail-card-image-wrap">
                          <img
                            src={imgUrl}
                            alt={trail.name}
                            className="trail-card-image"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = defaultTrailImage;
                            }}
                          />
                        </div>

                        <div className="trail-card-body">
                          <h3 className="trail-card-title" title={trail.name}>
                            <Link to={destinationUrl}>{trail.name}</Link>
                          </h3>

                          {trail.location && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                              <MapPin size={13} style={{ flexShrink: 0, color: "var(--primary)" }} />
                              <span>{trail.location}</span>
                            </div>
                          )}

                          <div className="trail-card-stats">
                            <span className={`badge-difficulty ${getDifficultyClass(trail.difficulty)}`}>
                              {trail.difficulty || "Moderate"}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Ruler size={13} style={{ color: "var(--text-muted)" }} />
                              {trail.distance || "5.0 km"}
                            </span>
                            {trail.exploredAt && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                <Calendar size={12} />
                                {new Date(trail.exploredAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>

                          <div className="trail-card-actions" style={{ marginTop: "12px" }}>
                            <Link
                              to={destinationUrl}
                              className="btn btn-outline btn-sm btn-block"
                              style={{ fontWeight: 600 }}
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "32px 20px", textAlign: "center", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                  <Compass size={36} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "16px", fontWeight: 500 }}>
                    You haven't explored any trails yet.
                  </p>
                  <Link to="/explore" className="btn btn-primary btn-sm">
                    Start Exploring Trails
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Achievements & Completed Trails */}
          {activeTab === "achievements" && (
            <div className="profile-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "28px" }}>🏆</span>
                  <div>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                      My Achievements & Completed Trails
                    </h2>
                    <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: "0.9rem" }}>
                      Trails you have conquered and unlocked badges
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="btn btn-outline btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowLeft size={16} /> Back to Profile
                </button>
              </div>

              {/* Total Completed Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 24px",
                  color: "#ffffff",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "24px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.9, fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase" }}>
                    <Sparkles size={14} /> Total Conquered
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, margin: "4px 0" }}>
                    {completedTrails.length} {completedTrails.length === 1 ? "Trail" : "Trails"} Completed
                  </div>
                </div>
                <Link to="/explore" className="btn btn-sm" style={{ backgroundColor: "#ffffff", color: "#1b5e20", fontWeight: 700 }}>
                  <Compass size={16} /> Explore Trails
                </Link>
              </div>

              {/* Adventure Badges Grid */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🎖️</span> Adventure Badges
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        backgroundColor: "#ffffff",
                        border: b.unlocked ? "2px solid #2e7d32" : "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "16px 12px",
                        textAlign: "center",
                        position: "relative",
                        opacity: b.unlocked ? 1 : 0.65
                      }}
                    >
                      {b.unlocked ? (
                        <div style={{ position: "absolute", top: "8px", right: "8px", color: "var(--primary)", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                          <CheckCircle size={12} /> Unlocked
                        </div>
                      ) : (
                        <div style={{ position: "absolute", top: "8px", right: "8px", color: "var(--text-muted)" }}>
                          <Lock size={12} />
                        </div>
                      )}
                      <div style={{ fontSize: "28px", margin: "4px auto 8px" }}>{b.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: b.unlocked ? "#1b5e20" : "var(--text-main)", marginBottom: "2px" }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                        {b.description}
                      </div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)" }}>
                        {b.progress} / {b.requiredCount} completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed Trails List */}
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✓</span> Completed Trails ({completedTrails.length})
              </h3>

              {loadingData ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <div
                    style={{
                      display: "inline-block",
                      width: "30px",
                      height: "30px",
                      border: "3px solid rgba(46, 125, 50, 0.2)",
                      borderTopColor: "var(--primary)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }}
                  />
                  <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>Loading completions...</p>
                </div>
              ) : completedTrails.length > 0 ? (
                <div className="trails-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                  {completedTrails.map((trail) => {
                    const destinationUrl = `/trail/${trail.slug || trail.trailId || trail.id}?name=${encodeURIComponent(trail.trailName || trail.name || '')}`;
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
                              top: "8px",
                              left: "8px",
                              backgroundColor: "#16a34a",
                              color: "#ffffff",
                              padding: "3px 8px",
                              borderRadius: "16px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <CheckCircle size={12} /> Completed
                          </div>
                        </div>

                        <div className="trail-card-body">
                          <h3 className="trail-card-title" title={trail.trailName || trail.name}>
                            <Link to={destinationUrl}>{trail.trailName || trail.name}</Link>
                          </h3>

                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                            <MapPin size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              Located in {trail.location || "India"}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
                            <Calendar size={12} />
                            <span>Completed: {new Date(trail.completedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>

                          <div className="trail-card-actions">
                            <Link to={destinationUrl} className="btn btn-outline btn-sm btn-block" style={{ fontWeight: 600 }}>
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "32px 20px", textAlign: "center", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
                  <Award size={36} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "16px", fontWeight: 500 }}>
                    You haven't marked any trails as completed yet.
                  </p>
                  <Link to="/explore" className="btn btn-primary btn-sm">
                    Explore & Complete Trails
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Settings */}
          {activeTab === "settings" && (

            <div className="profile-card">
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "24px" }}>
                Account Settings
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>Notifications</h4>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                    Receive trail condition updates, weather alerts, and community reviews.
                  </p>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked /> Email notifications for favorite trails
                  </label>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--danger)", marginBottom: "6px" }}>
                    Session Actions
                  </h4>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                    Logout from your current browser session.
                  </p>
                  <button onClick={handleLogout} className="btn btn-danger">
                    <LogOut size={16} /> Logout from TrailExplorer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
