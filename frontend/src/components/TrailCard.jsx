import React from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Ruler, Mountain, MapPin } from "lucide-react";
import { useTrails } from "../context/TrailContext";
import defaultTrailImage from "../assets/default-trail.jpg";

export default function TrailCard({ trail, showRemoveBtn = false, onRemove }) {
  const { isFavorite, toggleFavorite } = useTrails();

  const trailId = trail._id || trail.id || trail.slug;
  const favorited = isFavorite(trailId);

  const getDifficultyClass = (diff) => {
    const d = (diff || "").toLowerCase();
    if (d.includes("easy")) return "easy";
    if (d.includes("hard")) return "hard";
    return "moderate";
  };

  const getDifficultyColor = (diff) => {
    const d = (diff || "").toLowerCase();
    if (d.includes("easy")) return "#16a34a";
    if (d.includes("hard")) return "#dc2626";
    return "#16a34a";
  };

  const linkId = trail.slug || trail.id || trail._id;
  const destinationUrl = `/trail/${linkId}?name=${encodeURIComponent(trail.name || '')}&city=${encodeURIComponent(trail.city || trail.searchOriginName || '')}`;

  // Clean trail name to avoid ugly "Osm node [id]"
  const cleanTrailName = (name) => {
    if (!name) return "Scenic Nature Trail";
    if (/^osm\s*node/i.test(name) || /^osm-node/i.test(name) || /^node\s*\d+/i.test(name)) {
      return trail.city ? `${trail.city} Scenic Trail` : "Scenic Nature Trail";
    }
    return name;
  };

  const displayName = cleanTrailName(trail.name);

  // Format specific location
  const formatLocation = () => {
    if (trail.location && typeof trail.location === 'string' && trail.location !== 'India' && trail.location !== '[object Object]') {
      return trail.location;
    }
    if (trail.location && typeof trail.location === 'object' && trail.location.coordinates == null) {
      const parts = [trail.location.city || trail.city, trail.location.state || trail.state, trail.location.country || trail.country].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    const parts = [trail.city, trail.state, trail.country || 'India'].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'India';
  };

  const specificLocation = formatLocation();

  // Use Wikimedia image if available, otherwise use provided defaultTrailImage
  const displayImage = trail.imageUrl || trail.image || defaultTrailImage;

  // Separate Distance B (when exploring a city) vs Specific Location (in Favorites/Explore)
  const distanceText =
    trail.distanceFromSearchText ||
    (trail.distanceFromSearch
      ? `${trail.distanceFromSearch} from ${trail.city || trail.searchOriginName || 'searched location'}`
      : specificLocation
      ? `Located in ${specificLocation}`
      : null);

  return (
    <div className="trail-card">
      <div className="trail-card-image-wrap">
        <img
          src={displayImage}
          alt={displayName}
          className="trail-card-image"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = defaultTrailImage;
          }}
        />
        <button
          className={`favorite-btn ${favorited ? "favorited" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(trailId, trail);
          }}
          title={favorited ? "Remove from favorites" : "Save to favorites"}
          aria-label="Toggle favorite"
        >
          <Heart size={18} fill={favorited ? "#ef4444" : "none"} />
        </button>
      </div>

      <div className="trail-card-body">
        <h3 className="trail-card-title" title={displayName}>
          <Link to={destinationUrl}>{displayName}</Link>
        </h3>

        <div className="trail-card-rating">
          <Star size={15} className="rating-star" />
          <span>{trail.rating || 4.8}</span>
          <span className="rating-count">
            {trail.type ? `• ${trail.type}` : `(${trail.reviewCount || trail.reviewsCount || trail.reviews?.length || 0})`}
          </span>
        </div>

        {/* Specific Location / Distance */}
        {distanceText && (
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "8px"
            }}
          >
            <MapPin size={13} style={{ flexShrink: 0 }} />
            <span>📍 {distanceText}</span>
          </div>
        )}

        <div className="trail-card-stats">
          <span className={`badge-difficulty ${getDifficultyClass(trail.difficulty)}`}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: getDifficultyColor(trail.difficulty),
                display: "inline-block"
              }}
            />
            {trail.difficulty || "Moderate"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Ruler size={13} style={{ color: "var(--text-muted)" }} />
            {trail.distance || "5.0 km"}
          </span>
          {trail.elevation && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Mountain size={13} style={{ color: "var(--text-muted)" }} />
              {trail.elevation}
            </span>
          )}
        </div>

        <div className="trail-card-actions">
          <Link
            to={destinationUrl}
            className="btn btn-outline btn-sm btn-block"
            style={{ fontWeight: 600 }}
          >
            View Details
          </Link>
          {showRemoveBtn && (
            <button
              onClick={() => onRemove && onRemove(trailId)}
              className="btn btn-danger btn-sm"
              title="Remove from favorites"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
