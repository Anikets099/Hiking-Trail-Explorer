import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trailService } from "../services/trailService";
import { useTrails } from "../context/TrailContext";
import { Search, Navigation, MapPin } from "lucide-react";

export default function MapPage() {
  const { userLocation, setUserLocation } = useTrails();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetTrailId = searchParams.get("trail");

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const trailMarkersRef = useRef({});
  const searchLocationMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);

  const [trails, setTrails] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [userToSearchDistance, setUserToSearchDistance] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [locating, setLocating] = useState(false);

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
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await trailService.getTrails(params);
      if (res.success && res.data) {
        setTrails(res.data);
        setSearchLocation(res.searchLocation || res.location || null);
        setUserToSearchDistance(res.distanceFromUserToSearch || null);
      }
    } catch (e) {
      console.warn("Failed to load map trails:", e);
    }
  };

  useEffect(() => {
    fetchMapTrails(locationSearch);
  }, [userLocation]);

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
            <span>Search: ${searchLocation.name}</span>
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
            <h4 style="margin: 2px 0 6px 0; font-size: 14px; color: #0f172a;">${searchLocation.name}</h4>
            ${userToSearchDistance ? `<div style="font-size: 12px; color: #475569; font-weight: 600;">📍 ${userToSearchDistance} from your location</div>` : ''}
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
    trails.forEach((trail) => {
      if (trail.latitude == null || trail.longitude == null) return;

      const linkId = trail.slug || trail.id || trail._id;
      const displayImg = trail.imageUrl || trail.image || "/images/default-trail.jpg";
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
            <span>${trail.name}</span>
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      });

      const popupContent = `
        <div style="width: 200px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <img src="${displayImg}" alt="${trail.name}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" onerror="this.onerror=null; this.src='/images/default-trail.jpg';" />
          <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; color: #0f172a;">${trail.name}</h4>

          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 6px;">
            <span>⭐ ${trail.rating || 4.8}</span>
            <span>📏 ${trail.distance || '5.0 km'}</span>
          </div>
          ${distanceText ? `<div style="font-size: 11px; color: #2e7d32; font-weight: 700; margin-bottom: 6px;">📍 ${distanceText}</div>` : ''}
          <a href="/trail/${linkId}?name=${encodeURIComponent(trail.name || '')}&city=${encodeURIComponent(trail.city || searchLocation?.name || '')}" style="
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
    if (targetTrailId) {
      const match = trails.find((t) => t.slug === targetTrailId || t._id === targetTrailId || t.id === targetTrailId);
      if (match) {
        map.flyTo([match.latitude, match.longitude], 12, { duration: 1.5 });
        const m = trailMarkersRef.current[match._id || match.slug || match.id];
        if (m) m.openPopup();
      }
    } else if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [trails, searchLocation, userLocation, targetTrailId]);

  // Handle Browser Geolocation ("Use My Location")
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Keep user coordinates in session state (separate from searchLocation)
        setUserLocation({ lat: latitude, lng: longitude });
        setLocating(false);

        // If a search query is active, reload with user coordinates to get Distance A
        if (locationSearch && locationSearch.trim()) {
          fetchMapTrails(locationSearch.trim());
        } else {
          // If no search is active, discover nearby trails around user's GPS
          try {
            const res = await trailService.getNearbyTrails(latitude, longitude, 30);
            if (res.success && res.data) {
              setTrails(res.data);
              setSearchLocation({
                name: "Your Current Area",
                latitude,
                longitude
              });
            }
          } catch (e) {}
        }
      },
      (error) => {
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

      {/* Interactive Leaflet Map */}
      <div className="map-wrapper">
        <div ref={mapContainerRef} id="leaflet-map" />
      </div>
    </div>
  );
}
