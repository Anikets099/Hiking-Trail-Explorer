import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trailService } from "../services/trailService";
import { useTrails } from "../context/TrailContext";
import { Search, Navigation, MapPin } from "lucide-react";

// Trail and place names come from OpenStreetMap contributors, so they must be escaped
// before being placed into Leaflet's HTML strings.
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));

export default function MapPage() {
  const { userLocation, setUserLocation } = useTrails();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetTrailId = searchParams.get("trail");
  const targetName = searchParams.get("name") || "";
  const targetCity = searchParams.get("city") || "";
  const targetLat = searchParams.get("lat");
  const targetLng = searchParams.get("lng");

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const trailMarkersRef = useRef({});
  const searchLocationMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const requestIdRef = useRef(0);
  // Set once "Use My Location" is pressed with no search active: browse around the user
  const nearbyCenterRef = useRef(null);

  const [trails, setTrails] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [userToSearchDistance, setUserToSearchDistance] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locating, setLocating] = useState(false);
  // Trail requested through ?trail= that is not part of the currently loaded list
  const [targetTrail, setTargetTrail] = useState(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center default
    const initialLat = 13.3161; // Center near Chikmagalur / Western Ghats
    const initialLng = 75.7720;
    const initialZoom = 9;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true
    });

    // Official OpenStreetMap Tiles
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch trails dynamically from backend
  const fetchMapTrails = async (query = "") => {
    // Only the most recent request may update the map; older responses are dropped
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;
    const nearby = nearbyCenterRef.current;

    setSearchError("");
    try {
      if (!query.trim() && nearby) {
        const res = await trailService.getNearbyTrails(nearby.lat, nearby.lng, 30);
        if (isStale()) return;
        setTrails(res.results || res.data || []);
        setSearchLocation({ name: "Your Current Area", latitude: nearby.lat, longitude: nearby.lng });
        setUserToSearchDistance(null);
        return;
      }

      const params = {};
      if (query.trim()) params.search = query.trim();
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await trailService.getTrails(params);
      if (isStale()) return;
      if (res.success && res.data) {
        setTrails(res.data);
        setSearchLocation(res.searchLocation || res.location || null);
        setUserToSearchDistance(res.distanceFromUserToSearch || null);
      } else {
        setTrails([]);
        setSearchLocation(null);
        setUserToSearchDistance(null);
        setSearchError(res.message || "Trail search did not return a valid response.");
      }
    } catch (e) {
      if (isStale()) return;
      setTrails([]);
      setSearchLocation(null);
      setUserToSearchDistance(null);
      setSearchError(`${e.message || "Unable to connect to the trail search service."}${e.code ? ` (${e.code})` : ""}`);
      console.error("Failed to load map trails:", e);
    }
  };

  useEffect(() => {
    fetchMapTrails(locationSearch);
  }, [userLocation]);

  // "View on Map" can point at a trail outside the loaded list (e.g. a searched
  // OpenStreetMap place), so look that trail up on its own.
  useEffect(() => {
    if (!targetTrailId) {
      setTargetTrail(null);
      return;
    }

    let cancelled = false;
    trailService
      .getTrailById(targetTrailId, { name: targetName, city: targetCity, lat: targetLat, lng: targetLng })
      .then((res) => {
        if (!cancelled) setTargetTrail(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setTargetTrail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [targetTrailId, targetName, targetCity, targetLat, targetLng]);

  // Render Markers on Map (User Location + Search Location + Trail Markers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clear previous trail markers
    Object.values(trailMarkersRef.current).forEach((marker) => marker.remove());
    trailMarkersRef.current = {};

    // 2. Render / Update Search Location Marker
    if (searchLocationMarkerRef.current) {
      searchLocationMarkerRef.current.remove();
      searchLocationMarkerRef.current = null;
    }

    const allBounds = [];

    if (searchLocation && searchLocation.latitude != null && searchLocation.longitude != null) {
      const searchIcon = L.divIcon({
        className: "search-location-marker",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #14532d;
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid #ffffff;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <span style="font-size: 14px;">📍</span>
            <span>Search: ${escapeHtml(searchLocation.name)}</span>
          </div>
        `,
        iconSize: [140, 32],
        iconAnchor: [70, 16]
      });

      const searchMarker = L.marker([searchLocation.latitude, searchLocation.longitude], {
        icon: searchIcon,
        zIndexOffset: 1000
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase;">Search Location</div>
            <h4 style="margin: 2px 0 6px 0; font-size: 14px; color: #0f172a;">${escapeHtml(searchLocation.name)}</h4>
            ${userToSearchDistance ? `<div style="font-size: 12px; color: #475569; font-weight: 600;">📍 ${escapeHtml(userToSearchDistance)} from your location</div>` : ''}
          </div>
        `);

      searchLocationMarkerRef.current = searchMarker;
      allBounds.push([searchLocation.latitude, searchLocation.longitude]);
    }

    // 3. Render / Update User Location Marker (if enabled)
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }

    if (userLocation && userLocation.lat != null && userLocation.lng != null) {
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #2563eb;
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 20px;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3), 0 4px 10px rgba(0,0,0,0.25);
            border: 2px solid #ffffff;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <span style="font-size: 14px;">📍</span>
            <span>You are here</span>
          </div>
        `,
        iconSize: [120, 32],
        iconAnchor: [60, 16]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1200
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase;">Your Location</div>
            <h4 style="margin: 2px 0 4px 0; font-size: 14px; color: #0f172a;">Current Position</h4>
            <div style="font-size: 11px; color: #64748b;">GPS Coordinates Active</div>
          </div>
        `);

      userLocationMarkerRef.current = userMarker;
      allBounds.push([userLocation.lat, userLocation.lng]);
    }

    // 4. Render Trail Markers
    const isTarget = (t) => t.slug === targetTrailId || t._id === targetTrailId || t.id === targetTrailId;
    const mapTrails =
      targetTrailId && targetTrail && isTarget(targetTrail) && !trails.some(isTarget)
        ? [...trails, targetTrail]
        : trails;

    mapTrails.forEach((trail) => {
      if (trail.latitude == null || trail.longitude == null) return;

      const linkId = trail.slug || trail.id || trail._id;
      const trailName = escapeHtml(trail.name);
      const displayImg = escapeHtml(trail.imageUrl || trail.image || "/images/default-trail.jpg");
      const detailsUrl = `/trail/${encodeURIComponent(linkId)}?name=${encodeURIComponent(trail.name || '')}&city=${encodeURIComponent(trail.city || searchLocation?.name || '')}&lat=${trail.latitude}&lng=${trail.longitude}`;
      const distanceText =
        trail.distanceFromSearchText ||
        (trail.distanceFromSearch ? `${trail.distanceFromSearch} from ${trail.searchOriginName || searchLocation?.name || 'search'}` : null);

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            padding: 4px 10px;
            border-radius: 20px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.2);
            border: 1.5px solid #2e7d32;
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <span style="color: #ef4444; font-size: 13px;">📍</span>
            <span>${trailName}</span>
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      });

      const popupContent = `
        <div style="width: 200px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <img src="${displayImg}" alt="${trailName}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" onerror="this.onerror=null; this.src='/images/default-trail.jpg';" />
          <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; color: #0f172a;">${trailName}</h4>

          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 6px;">
            <span>⭐ ${trail.rating ? Number(trail.rating).toFixed(1) : 'New'}</span>
            <span>📏 ${escapeHtml(trail.distance || 'Not listed')}</span>
          </div>
          ${distanceText ? `<div style="font-size: 11px; color: #2e7d32; font-weight: 700; margin-bottom: 6px;">📍 ${escapeHtml(distanceText)}</div>` : ''}
          <a href="${escapeHtml(detailsUrl)}" style="
            display: block;
            text-align: center;
            background: #2e7d32;
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 10px;
            border-radius: 6px;
            text-decoration: none;
          ">View Details</a>
        </div>
      `;

      const marker = L.marker([trail.latitude, trail.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

      trailMarkersRef.current[trail._id || trail.slug || trail.id] = marker;
      allBounds.push([trail.latitude, trail.longitude]);
    });

    // 5. Fit bounds or fly to target
    const match = targetTrailId
      ? mapTrails.find((t) => isTarget(t) && t.latitude != null && t.longitude != null)
      : null;
    if (match) {
      map.flyTo([match.latitude, match.longitude], 12, { duration: 1.5 });
      const m = trailMarkersRef.current[match._id || match.slug || match.id];
      if (m) m.openPopup();
    } else if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [trails, searchLocation, userLocation, userToSearchDistance, targetTrailId, targetTrail]);

  // Handle Browser Geolocation ("Use My Location")
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocating(false);
        // With no search active, discover trails around the user's GPS position
        if (!locationSearch.trim()) {
          nearbyCenterRef.current = { lat: latitude, lng: longitude };
        }
        // Keep user coordinates in session state (separate from searchLocation).
        // The userLocation effect reloads the map: an active search gains Distance A,
        // otherwise nearby trails are loaded.
        setUserLocation({ lat: latitude, lng: longitude });
      },
      () => {
        setLocating(false);
        alert("Unable to retrieve your location. Please enable location permissions.");
      },
      { timeout: 10000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMapTrails(locationSearch);
  };

  return (
    <div className="map-page-container">
      {/* Top Map Controls Bar */}
      <div className="map-controls-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-wrap" style={{ maxWidth: "340px" }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search location (e.g. Chikmagalur, Munnar)..."
            value={locationSearch}
            onChange={(e) => {
              setLocationSearch(e.target.value);
              if (e.target.value === "") {
                fetchMapTrails("");
              }
            }}
          />
        </form>

        <button
          type="button"
          onClick={handleMyLocation}
          className="btn btn-secondary"
          disabled={locating}
          style={{ backgroundColor: "#ffffff" }}
        >
          <Navigation size={16} style={{ color: "var(--primary)" }} />
          {locating ? "Locating..." : "Use My Location"}
        </button>

        {/* Distance Banner if both search location and user location exist */}
        {searchLocation && userLocation && userToSearchDistance && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#15803d",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>📍</span>
            <span>Your Location → {searchLocation.name}: {userToSearchDistance}</span>
          </div>
        )}
      </div>

      {searchError && (
        <p
          role="alert"
          style={{
            margin: "12px 0",
            padding: "12px 16px",
            color: "#991b1b",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-md)"
          }}
        >
          {searchError}
        </p>
      )}

      {/* Interactive Leaflet Map */}
      <div className="map-wrapper">
        <div ref={mapContainerRef} id="leaflet-map" />
      </div>
    </div>
  );
}
