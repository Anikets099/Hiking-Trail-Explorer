import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { trailService } from '../services/trailService';
import { favoriteService } from '../services/favoriteService';
import { reviewService } from '../services/reviewService';
import { useAuth } from './AuthContext';

const TrailContext = createContext();

export function TrailProvider({ children }) {
  const { user } = useAuth();
  const [popularTrails, setPopularTrails] = useState([]);
  const [favoriteGroups, setFavoriteGroups] = useState([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Every identifier one trail can be known by: the same place is "osm-node-1" in
  // search results but a Mongo _id (plus slug / externalId) once it has been saved.
  const getTrailAliases = (trail, extraId) => {
    const ids = [extraId, trail?._id, trail?.id, trail?.slug, trail?.externalId]
      .filter((value) => value != null && value !== '')
      .map(String);
    return [...new Set(ids)];
  };

  const matchesAny = (group, aliases) => aliases.some((alias) => group.includes(alias));

  // Flat list of every favorited identifier
  const favorites = useMemo(() => favoriteGroups.flat(), [favoriteGroups]);

  // Load popular trails on mount
  useEffect(() => {
    const loadPopular = async () => {
      try {
        const res = await trailService.getPopularTrails(
          userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {}
        );
        if (res.success && res.data) {
          setPopularTrails(res.data);
        }
      } catch (err) {
        console.warn('Failed to load popular trails:', err.message);
      }
    };

    loadPopular();
  }, [userLocation]);

  // Load user favorites from backend when logged in
  useEffect(() => {
    let cancelled = false;

    const loadFavorites = async () => {
      setFavoritesReady(false);
      if (user) {
        try {
          const res = await favoriteService.getFavorites();
          if (!cancelled && res.success && res.data) {
            setFavoriteGroups(res.data.map((t) => getTrailAliases(t)));
            setFavoritesReady(true);
          }
        } catch (err) {
          console.warn('Failed to load favorites:', err.message);
        }
      } else {
        setFavoriteGroups([]);
      }
    };

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const isFavorite = (trailId) => {
    return trailId != null && favorites.includes(String(trailId));
  };

  const toggleFavorite = async (trailId, trailData = {}) => {
    if (!user) {
      alert('Please login to save trails to your favorites!');
      return false;
    }

    const aliases = getTrailAliases(trailData, trailId);
    const previousGroups = favoriteGroups;
    const isFav = previousGroups.some((group) => matchesAny(group, aliases));

    if (isFav) {
      setFavoriteGroups((prev) => prev.filter((group) => !matchesAny(group, aliases)));
      try {
        await favoriteService.removeFavorite(trailId);
      } catch (err) {
        // Revert on failure
        setFavoriteGroups(previousGroups);
        return false;
      }
    } else {
      setFavoriteGroups((prev) => [...prev, aliases]);
      try {
        const res = await favoriteService.addFavorite(trailId, trailData);
        // The saved record carries the database identifiers for this trail
        const savedAliases = [...new Set([...aliases, ...getTrailAliases(res.data)])];
        setFavoriteGroups((prev) => prev.map((group) => (group === aliases ? savedAliases : group)));
      } catch (err) {
        // Revert on failure
        setFavoriteGroups((prev) => prev.filter((group) => group !== aliases));
        return false;
      }
    }
    return true;
  };

  const removeFavorite = async (trailId, trailData = {}) => {
    const aliases = getTrailAliases(trailData, trailId);
    setFavoriteGroups((prev) => prev.filter((group) => !matchesAny(group, aliases)));
    if (user) {
      try {
        await favoriteService.removeFavorite(trailId);
      } catch (e) {}
    }
  };

  const fetchTrails = useCallback(
    async (filters = {}) => {
      setLoading(true);
      try {
        const queryParams = {
          ...filters
        };
        if (userLocation) {
          queryParams.lat = userLocation.lat;
          queryParams.lng = userLocation.lng;
        }

        const res = await trailService.getTrails(queryParams);
        setLoading(false);
        return res;
      } catch (error) {
        setLoading(false);
        return {
          success: false,
          message: error.message || 'Unable to load trails.',
          code: error.code,
          data: [],
          results: []
        };
      }
    },
    [userLocation]
  );

  const fetchNearbyTrails = async (lat, lng, radius = 25, filters = {}) => {
    setLoading(true);
    try {
      const res = await trailService.getNearbyTrails(lat, lng, radius, filters);
      setLoading(false);
      return res;
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        status: error.status,
        code: error.code,
        diagnostics: error.data?.diagnostics,
        message: error.message || 'Unable to load nearby trails.',
        data: [],
        results: []
      };
    }
  };

  const getTrailById = async (id, queryParams = {}) => {
    try {
      const res = await trailService.getTrailById(id, queryParams);
      return res.data || null;
    } catch (error) {
      return null;
    }
  };

  const addTrail = async (trailData) => {
    const res = await trailService.createTrail(trailData);
    if (res.success && res.data) {
      setPopularTrails((prev) => [res.data, ...prev]);
    }
    return res;
  };

  const updateTrail = async (id, trailData) => {
    const res = await trailService.updateTrail(id, trailData);
    if (res.success && res.data) {
      setPopularTrails((prev) =>
        prev.map((t) => (t._id === id || t.id === id ? res.data : t))
      );
    }
    return res;
  };

  const deleteTrail = async (id) => {
    const res = await trailService.deleteTrail(id);
    if (res.success) {
      setPopularTrails((prev) => prev.filter((t) => t._id !== id && t.id !== id));
      setFavoriteGroups((prev) => prev.filter((group) => !group.includes(String(id))));
    }
    return res;
  };

  const addReview = async (trailId, reviewData) => {
    return await reviewService.createReview(trailId, reviewData);
  };

  return (
    <TrailContext.Provider
      value={{
        popularTrails,
        favorites,
        favoritesReady,
        userLocation,
        setUserLocation,
        loading,
        toggleFavorite,
        removeFavorite,
        isFavorite,
        fetchTrails,
        fetchNearbyTrails,
        getTrailById,
        addTrail,
        updateTrail,
        deleteTrail,
        addReview
      }}
    >
      {children}
    </TrailContext.Provider>
  );
}

export function useTrails() {
  return useContext(TrailContext);
}
