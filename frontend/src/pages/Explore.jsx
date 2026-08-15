import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTrails } from "../context/TrailContext";
import TrailCard from "../components/TrailCard";
import FilterBar from "../components/FilterBar";
import { AlertCircle, Navigation, MapPin } from "lucide-react";

export default function Explore() {
  const { fetchTrails, fetchNearbyTrails, userLocation, setUserLocation } = useTrails();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  const [trails, setTrails] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [userToSearchDistance, setUserToSearchDistance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(Boolean(initialSearch));
  const [isLocating, setIsLocating] = useState(false);

  // Perform search query to backend
  const loadData = useCallback(
    async (overrideSearch) => {
      setLoading(true);
      const querySearch = overrideSearch !== undefined ? overrideSearch : searchTerm;

      const res = await fetchTrails({
        search: querySearch.trim(),
        difficulty: difficultyFilter,
        distance: distanceFilter,
        sortBy
      });

      const trailList = res.results || res.data || (Array.isArray(res) ? res : []);
      setTrails(trailList);

      if (res.searchLocation) {
        setSearchLocation(res.searchLocation);
      } else if (!querySearch.trim()) {
        setSearchLocation(null);
      }

      if (res.distanceFromUserToSearch) {
        setUserToSearchDistance(res.distanceFromUserToSearch);
      } else {
        setUserToSearchDistance(null);
      }

      setLoading(false);
      setHasSearched(Boolean(querySearch.trim()));
    },
    [fetchTrails, searchTerm, difficultyFilter, distanceFilter, sortBy]
  );

  // Initial load or filter change
  useEffect(() => {
    loadData();
  }, [difficultyFilter, distanceFilter, sortBy, userLocation]);

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      setSearchParams({ search: searchTerm.trim() });
    } else {
      setSearchParams({});
    }
    loadData(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchLocation(null);
    setUserToSearchDistance(null);
    setSearchParams({});
    loadData("");
  };

  // Browser Geolocation for "Use My Location"
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Keep user coordinates in session state (separate from searchLocation)
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);

        // If a search query is already active, keep it and refresh distance from user -> search location
        if (searchTerm && searchTerm.trim()) {
          loadData(searchTerm.trim());
        } else {
          // If no search is active, discover nearby trails around user's GPS position
          setLoading(true);
          const nearbyRes = await fetchNearbyTrails(latitude, longitude, 30);
          const nearbyList = nearbyRes.results || nearbyRes.data || (Array.isArray(nearbyRes) ? nearbyRes : []);
          setTrails(nearbyList);
          setSearchLocation({
            name: "Your Current Area",
            latitude,
            longitude
          });
          setUserToSearchDistance(null);
          setLoading(false);
          setHasSearched(true);
        }
      },
      (error) => {
        setIsLocating(false);
        alert("Unable to access your location. Please enable location permissions.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="container" style={{ paddingBottom: "60px" }}>
      <div className="page-header">
        <h1 className="page-title">Explore Trails</h1>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        distanceFilter={distanceFilter}
        setDistanceFilter={setDistanceFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onUseMyLocation={handleUseMyLocation}
        isLocating={isLocating}
      />

      {/* Small Information Section for Searched Location & User Distance */}
      {searchLocation && searchLocation.name && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16a34a"
              }}
            >
              <MapPin size={18} />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>
                Search Location
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#14532d" }}>
                {searchLocation.name}
              </span>
            </div>
          </div>

          {/* DISTANCE A: User Current Location -> Searched Location */}
          {userLocation && userToSearchDistance && (
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1.5px solid #86efac",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#15803d",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
              }}
            >
              <Navigation size={14} style={{ color: "#16a34a" }} />
              <span>Your Location → {searchLocation.name}: {userToSearchDistance}</span>
            </div>
          )}
        </div>
      )}

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
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Discovering trails & outdoor places...
          </p>
        </div>
      ) : trails.length > 0 ? (
        <div className="trails-grid trails-grid-3">
          {trails.map((trail) => (
            <TrailCard key={trail._id || trail.id || trail.slug} trail={trail} />
          ))}
        </div>
      ) : (
        /* Empty State: No Trails Found */
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#ffffff",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            maxWidth: "600px",
            margin: "0 auto"
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-muted)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-main)" }}>
            No hiking places found near this location
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "20px" }}>
            {hasSearched && searchTerm.trim()
              ? `No hiking trails or outdoor places found near "${searchTerm}". Try searching for another city.`
              : "No hiking places found matching the current search criteria."}
          </p>
          <button onClick={handleClearSearch} className="btn btn-primary btn-sm">
            Reset Search
          </button>
        </div>
      )}
    </div>
  );
}
