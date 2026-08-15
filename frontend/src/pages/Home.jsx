import React from "react";
import { Link } from "react-router-dom";
import { useTrails } from "../context/TrailContext";
import TrailCard from "../components/TrailCard";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { popularTrails } = useTrails();

  // Top 4 popular trails from backend
  const displayTrails = popularTrails.slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url('/images/hero.png')`
        }}
      >
        <div className="hero-overlay" />
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Explore The Trails.<br />
              Discover Your Adventure.
            </h1>
            <p className="hero-description">
              Find the best hiking trails based on difficulty, distance and location.
            </p>
            <div className="hero-actions">
              <Link to="/explore" className="btn btn-primary btn-lg">
                Explore Trails
              </Link>
              <Link to="/map" className="btn btn-outline-white btn-lg">
                View Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Trails Section */}
      <section className="container" style={{ marginBottom: "60px" }}>
        <div className="section-header">
          <h2 className="section-title">Popular Trails</h2>
          <Link to="/explore" className="section-link">
            See all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="trails-grid trails-grid-4">
          {displayTrails.map((trail) => (
            <TrailCard key={trail._id || trail.id || trail.slug} trail={trail} />
          ))}
        </div>
      </section>
    </div>
  );
}
