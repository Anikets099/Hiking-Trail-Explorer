import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTrails } from "../context/TrailContext";
import { favoriteService } from "../services/favoriteService";
import TrailCard from "../components/TrailCard";
import { Heart, Compass } from "lucide-react";

export default function Favorites() {
  const { user } = useAuth();
  const { isFavorite, favoritesReady, removeFavorite } = useTrails();
  const [favoriteTrails, setFavoriteTrails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavoriteTrails([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await favoriteService.getFavorites();
        if (res.success && res.data) {
          setFavoriteTrails(res.data);
        }
      } catch (err) {
        console.warn("Failed to load favorites:", err);
      }
      setLoading(false);
    };

    loadFavorites();
  }, [user?._id]);

  const handleRemove = async (trailId, trail) => {
    await removeFavorite(trailId, trail);
    setFavoriteTrails((prev) => prev.filter((t) => (t._id !== trailId && t.slug !== trailId && t.id !== trailId)));
  };

  // Hide a card as soon as it is un-favorited through its heart button
  const visibleTrails = favoritesReady
    ? favoriteTrails.filter((t) => isFavorite(t._id || t.id || t.slug))
    : favoriteTrails;

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
          <Heart size={32} />
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>
          Login to View Your Favorite Trails
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
          Create an account or log in to bookmark scenic hiking trails across Maharashtra.
        </p>
        <Link to="/login" className="btn btn-primary">
          Log In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: "60px" }}>
      <div className="page-header">
        <h1 className="page-title">My Favorite Trails</h1>
      </div>

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
          <p style={{ color: "var(--text-muted)" }}>Loading your favorites...</p>
        </div>
      ) : visibleTrails.length > 0 ? (
        <div className="trails-grid trails-grid-4">
          {visibleTrails.map((trail) => (
            <TrailCard
              key={trail._id || trail.id || trail.slug}
              trail={trail}
              showRemoveBtn={true}
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
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
            <Heart size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
            No favorite trails saved yet
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
            Explore our curated trails and click the heart icon on any trail to save it to your favorites.
          </p>
          <Link to="/explore" className="btn btn-primary">
            <Compass size={18} /> Explore Trails
          </Link>
        </div>
      )}
    </div>
  );
}
