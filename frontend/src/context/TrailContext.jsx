import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { trailService } from '../services/trailService';
import { favoriteService } from '../services/favoriteService';
import { reviewService } from '../services/reviewService';
import { useAuth } from './AuthContext';

const TrailContext = createContext();

export function TrailProvider({ children }) {
  const { user } = useAuth();
  const [popularTrails, setPopularTrails] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper to normalize trail ID (supports both _id, id, and slug)
  const getTrailIdentifier = (trail) => {
    return trail.slug || trail.id || trail._id;
  };

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
    const loadFavorites = async () => {
      if (user) {
        try {
          const res = await favoriteService.getFavorites();
          if (res.success && res.data) {
            setFavorites(res.data.map((t) => t._id || t.id || t.slug));
          }
        } catch (err) {
          console.warn('Failed to load favorites:', err.message);
        }
      } else {
        setFavorites([]);
      }
    };

    loadFavorites();
  }, [user]);

  const toggleFavorite = async (trailId, trailData = {}) => {
    if (!user) {
      alert('Please login to save trails to your favorites!');
      return false;
    }

    const isFav = favorites.includes(trailId);
    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== trailId));
      try {
        await favoriteService.removeFavorite(trailId);
      } catch (err) {
        // Revert on failure
        setFavorites((prev) => [...prev, trailId]);
      }
    } else {
      setFavorites((prev) => [...prev, trailId]);
      try {
        await favoriteService.addFavorite(trailId, trailData);
      } catch (err) {
        // Revert on failure
        setFavorites((prev) => prev.filter((id) => id !== trailId));
      }
    }
  };


  const isFavorite = (trailId) => {
    return favorites.includes(trailId);
  };

  const removeFavorite = async (trailId) => {
    setFavorites((prev) => prev.filter((id) => id !== trailId));
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
        return { success: false, data: [], results: [] };
      }
    },
    [userLocation]
  );

  const fetchNearbyTrails = async (lat, lng, radius = 25) => {
    setLoading(true);
    try {
      const res = await trailService.getNearbyTrails(lat, lng, radius);
      setLoading(false);
      return res;
    } catch (error) {
      setLoading(false);
      return { success: false, data: [], results: [] };
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
      setFavorites((prev) => prev.filter((favId) => favId !== id));
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
