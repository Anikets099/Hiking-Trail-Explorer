import React from "react";
import { Search, X, Navigation } from "lucide-react";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  onClearSearch,
  difficultyFilter,
  setDifficultyFilter,
  distanceFilter,
  setDistanceFilter,
  sortBy,
  setSortBy,
  onUseMyLocation,
  isLocating
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="explore-filter-bar">
      {/* Search Input with Search & Clear Buttons */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
        className="search-input-wrap"
      >
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search hiking trails (e.g. Mumbai, Pune, Lonavala)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value === "") {
              onClearSearch();
            }
          }}
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={onClearSearch}
            style={{
              position: "absolute",
              right: "90px",
              color: "var(--text-muted)",
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          style={{
            position: "absolute",
            right: "6px",
            height: "32px",
            padding: "0 14px",
            borderRadius: "var(--radius-sm)"
          }}
        >
          Search
        </button>
      </form>

      {/* Difficulty Dropdown */}
      <select
        className="filter-select"
        value={difficultyFilter}
        onChange={(e) => setDifficultyFilter(e.target.value)}
      >
        <option value="all">All Difficulties</option>
        <option value="Easy">Easy</option>
        <option value="Moderate">Moderate</option>
        <option value="Hard">Hard</option>
      </select>

      {/* Distance Dropdown */}
      <select
        className="filter-select"
        value={distanceFilter}
        onChange={(e) => setDistanceFilter(e.target.value)}
      >
        <option value="all">All Distances</option>
        <option value="under5">Under 5 km</option>
        <option value="5to10">5–10 km</option>
        <option value="above10">Above 10 km</option>
      </select>

      {/* Sort By Dropdown */}
      <select
        className="filter-select"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="rating">Sort by: Rating</option>
        <option value="distance">Sort by: Distance</option>
        <option value="name">Sort by: Name</option>
      </select>

      {/* Near Me / Use My Location Button */}
      {onUseMyLocation && (
        <button
          type="button"
          onClick={onUseMyLocation}
          className="btn btn-secondary"
          style={{ height: "44px" }}
          disabled={isLocating}
          title="Find trails near your current location"
        >
          <Navigation size={16} style={{ color: "var(--primary)" }} />
          {isLocating ? "Locating..." : "Use My Location"}
        </button>
      )}
    </div>
  );
}
