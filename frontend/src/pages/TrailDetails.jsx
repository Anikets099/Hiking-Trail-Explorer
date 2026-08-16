import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTrails } from "../context/TrailContext";
import { useAuth } from "../context/AuthContext";
import { reviewService } from "../services/reviewService";
import { userService } from "../services/userService";
import { completionService } from "../services/completionService";
import defaultTrailImage from "../assets/default-trail.jpg";
import {
  ArrowLeft,
  Star,
  MapPin,
  Ruler,
  Mountain,
  Clock,
  Calendar,
  CheckCircle2,
  CheckCircle,
  Heart,
  Map,
  Send,
  MessageSquare,
  ExternalLink,
  Award
} from "lucide-react";

export default function TrailDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getTrailById, isFavorite, toggleFavorite } = useTrails();
  const { user } = useAuth();
  const backendBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

  const [trail, setTrail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadTrailData = async () => {
      setLoading(true);
      const queryName = searchParams.get("name") || "";
      const queryCity = searchParams.get("city") || "";

      const data = await getTrailById(id, { name: queryName, city: queryCity });
      if (data) {
        setTrail(data);

        // Record explored trail for current user
        if (user) {
          userService.recordTrailExplored(data._id || data.slug || id).catch(() => {});
          completionService.checkCompletion(data._id || data.slug || id)
            .then((res) => {
              if (res.success && res.completed) {
                setIsCompleted(true);
              }
            })
            .catch(() => {});
        }

        // Load reviews
        try {
          const revRes = await reviewService.getTrailReviews(data._id || data.slug || id);
          if (revRes.success && revRes.data) {
            setReviews(revRes.data);
          }
        } catch (e) {
          setReviews(data.reviews || []);
        }
      }
      setLoading(false);
    };

    loadTrailData();
  }, [id, searchParams, user]);



  if (loading) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
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
        <p style={{ color: "var(--text-muted)" }}>Loading trail details...</p>
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Trail Not Found</h2>
        <p style={{ color: "var(--text-muted)", margin: "16px 0 24px" }}>
          The hiking trail you are looking for does not exist or has been removed.
        </p>
        <Link to="/explore" className="btn btn-primary">
          Back to Explore
        </Link>
      </div>
    );
  }

  const trailId = trail._id || trail.id || trail.slug;
  const favorited = isFavorite(trailId);

  const gallery =
    trail.galleryUrls && trail.galleryUrls.length > 0
      ? [trail.imageUrl, ...trail.galleryUrls].filter(Boolean)
      : trail.imageUrl
      ? [trail.imageUrl]
      : [defaultTrailImage];

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to submit a review!");
      navigate("/login");
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await reviewService.createReview(trail._id || trail.slug, {
        rating: reviewRating,
        comment: reviewComment
      });

      if (res.success && res.data) {
        setReviews([res.data, ...reviews]);
        setReviewComment("");
        setShowReviewForm(false);
      }
    } catch (err) {
      alert(err.message || "Failed to submit review");
    }
    setSubmittingReview(false);
  };

  const getDifficultyClass = (diff) => {
    const d = (diff || "").toLowerCase();
    if (d.includes("easy")) return "easy";
    if (d.includes("hard")) return "hard";
    return "moderate";
  };

  const displayMainImage = gallery[activeImageIndex] || trail.imageUrl || defaultTrailImage;

  return (
    <div className="container" style={{ paddingBottom: "60px" }}>
      {/* Back button */}
      <Link to="/explore" className="back-link">
        <ArrowLeft size={18} /> Back to trails
      </Link>

      {/* 2-Column Trail Details */}
      <div className="trail-details-layout">
        {/* Left Column: Details & Information */}
        <div>
          <div className="details-title-row">
            <h1 className="details-title">{trail.name}</h1>
          </div>

          <div className="details-meta-row">
            <div className="details-rating">
              <Star size={18} className="rating-star" />
              <span>{trail.rating || 4.8}</span>
              <span className="rating-count">
                ({trail.reviewCount || reviews.length || 0} reviews)
              </span>
            </div>
            <span className={`badge-difficulty ${getDifficultyClass(trail.difficulty)}`}>
              {trail.difficulty || "Moderate"}
            </span>
          </div>

          <div className="details-location">
            <MapPin size={16} style={{ color: "var(--primary)" }} />
            <span>
              {trail.city ? `${trail.city}, ${trail.state || "India"}` : "India"}
            </span>
          </div>

          {/* 4 Stats Cards Grid */}
          <div className="stats-cards-grid">
            <div className="stat-card-box">
              <Ruler size={20} className="stat-card-icon" />
              <span className="stat-card-label">Distance</span>
              <span className="stat-card-value">{trail.distance || "5.0 km"}</span>
            </div>
            <div className="stat-card-box">
              <Mountain size={20} className="stat-card-icon" />
              <span className="stat-card-label">Elevation</span>
              <span className="stat-card-value">{trail.elevation || "800 m"}</span>
            </div>
            <div className="stat-card-box">
              <Clock size={20} className="stat-card-icon" />
              <span className="stat-card-label">Time</span>
              <span className="stat-card-value">{trail.hikingTime || "2-3 hrs"}</span>
            </div>
            <div className="stat-card-box">
              <Calendar size={20} className="stat-card-icon" />
              <span className="stat-card-label">Best Time</span>
              <span className="stat-card-value">{trail.bestTime || "Oct - Mar"}</span>
            </div>
          </div>

          {/* About Trail */}
          <div className="details-section">
            <h3 className="details-section-title">About Trail</h3>
            <p>{trail.description}</p>
          </div>

          {/* Safety Tips */}
          <div className="details-section">
            <h3 className="details-section-title">Safety Tips</h3>
            <ul className="safety-tips-list">
              {(trail.safetyTips || [
                "Carry enough drinking water (at least 2-3 liters)",
                "Wear proper trekking shoes with reliable grip",
                "Avoid plastic and pack out all trash",
                "Start early in the morning"
              ]).map((tip, index) => (
                <li key={index} className="safety-tip-item">
                  <CheckCircle2 size={18} className="safety-tip-icon" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Buttons: View on Map, Save Trail, Mark as Completed */}
          <div className="details-actions" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <button
              onClick={() => navigate(`/map?trail=${trail.slug || trail._id}`)}
              className="btn btn-outline"
              style={{ minWidth: "140px" }}
            >
              <Map size={18} /> View on Map
            </button>
            <button
              onClick={() => toggleFavorite(trailId, trail)}
              className={`btn ${favorited ? "btn-primary" : "btn-outline"}`}
              style={{ minWidth: "140px" }}
            >
              <Heart size={18} fill={favorited ? "#ffffff" : "none"} />
              {favorited ? "Saved in Favorites" : "Save Trail"}
            </button>
            <button
              onClick={async () => {
                if (!user) {
                  alert("Please login to mark trails as completed!");
                  navigate("/login");
                  return;
                }
                setCompleting(true);
                try {
                  if (isCompleted) {
                    await completionService.removeCompletion(trail._id || trail.slug || id);
                    setIsCompleted(false);
                  } else {
                    await completionService.markCompleted(trail._id || trail.slug || id, trail);
                    setIsCompleted(true);
                  }
                } catch (err) {
                  console.warn("Completion error:", err);
                }
                setCompleting(false);
              }}
              disabled={completing}
              className={`btn ${isCompleted ? "btn-primary" : "btn-outline"}`}
              style={{
                minWidth: "170px",
                backgroundColor: isCompleted ? "#16a34a" : undefined,
                borderColor: isCompleted ? "#16a34a" : undefined,
                color: isCompleted ? "#ffffff" : undefined,
                fontWeight: 600
              }}
              title={isCompleted ? "You completed this trail! Click to toggle" : "Mark trail as completed"}
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={18} /> ✓ Completed
                </>
              ) : (
                <>
                  <Award size={18} /> 🏆 Mark as Completed
                </>
              )}
            </button>
          </div>


        </div>

        {/* Right Column: Featured Image & Gallery */}
        <div className="details-gallery-wrap">
          <div className="details-main-img">
            <img
              src={displayMainImage}
              alt={trail.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultTrailImage;
              }}
            />
          </div>

          {/* Wikimedia Commons Image Attribution if authentic image displayed */}
          {trail.imageAttribution && trail.imageUrl && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                backgroundColor: "var(--bg-muted)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px"
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                📷 {trail.imageAttribution}
              </span>
              {trail.sourceUrl && (
                <a
                  href={trail.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "var(--primary)", fontWeight: 600 }}
                >
                  Source <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}

          {/* Gallery Thumbnails (if multiple images) */}
          {gallery.length > 1 && (
            <div className="details-thumbnails-grid">
              {gallery.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className={`thumbnail-box ${activeImageIndex === idx ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={img}
                    alt={`${trail.name} thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultTrailImage;
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <section className="reviews-section">
        <div className="reviews-header">
          <h2 className="section-title">Reviews & Experience</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            <MessageSquare size={16} /> {showReviewForm ? "Cancel" : "Write a Review"}
          </button>
        </div>

        {/* Add Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="add-review-form">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>
              Share Your Trekking Experience
            </h3>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{ color: star <= reviewRating ? "var(--star)" : "#cbd5e1" }}
                  >
                    <Star size={24} fill={star <= reviewRating ? "var(--star)" : "none"} />
                  </button>
                ))}
                <span style={{ fontWeight: 600, marginLeft: "8px" }}>
                  {reviewRating} of 5 Stars
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Review / Tips for other trekkers</label>
              <textarea
                rows="3"
                required
                className="form-control"
                placeholder="How was the trail condition? Best time to start? Water availability?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submittingReview}>
              <Send size={16} /> {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews && reviews.length > 0 ? (
            reviews.map((rev, idx) => (
              <div key={rev._id || idx} className="review-card">
                <div className="review-header">
                  <div className="review-author-wrap">
                    <div className="review-avatar">
                      <img
                        src={rev.user?.profileImage ? (rev.user.profileImage.startsWith('/uploads/') ? `${backendBaseUrl}${rev.user.profileImage}` : rev.user.profileImage) : "/images/avatar.png"}
                        alt={rev.user?.name || "Trekker"}
                        onError={(e) => {
                          e.target.src = "/images/avatar.png";
                        }}
                      />
                    </div>
                    <div>
                      <div className="review-author-name">{rev.user?.name || rev.author || "Adventurer"}</div>
                      <div className="review-date">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : (rev.date || "Recent")}
                      </div>
                    </div>
                  </div>

                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        fill={i < (rev.rating || 5) ? "var(--star)" : "none"}
                        style={{ color: i < (rev.rating || 5) ? "var(--star)" : "#cbd5e1" }}
                      />
                    ))}
                  </div>
                </div>
                <p className="review-comment">{rev.comment}</p>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              No reviews yet. Be the first adventurer to share your experience!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
