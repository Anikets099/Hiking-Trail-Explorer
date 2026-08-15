import { apiRequest } from './api';

export const trailService = {
  /**
   * Main Trail Search & Filter Service
   * Routes city search to dynamic /explore/search API and handles filters/sorting
   */
  async getTrails(params = {}) {
    // If a search query is provided, dynamically discover trails via Nominatim + Overpass + Wikimedia
    if (params.search && params.search.trim()) {
      const cityQuery = params.search.trim();
      const query = new URLSearchParams({ city: cityQuery });

      if (params.lat != null && params.lng != null) {
        query.append('userLat', params.lat);
        query.append('userLng', params.lng);
      }

      const res = await apiRequest(`/explore/search?${query.toString()}`);
      let trails = res.results || res.data || [];

      // Apply difficulty filter
      if (params.difficulty && params.difficulty !== 'all') {
        const diffLower = params.difficulty.toLowerCase();
        trails = trails.filter((t) => (t.difficulty || '').toLowerCase().includes(diffLower));
      }

      // Apply distance filter (distance from searched location)
      if (params.distance && params.distance !== 'all') {
        if (params.distance === 'under5') {
          trails = trails.filter((t) => (t.distanceFromSearchKm || t.distanceNum || 5) < 5.0);
        } else if (params.distance === '5to10') {
          trails = trails.filter(
            (t) =>
              (t.distanceFromSearchKm || t.distanceNum || 5) >= 5.0 &&
              (t.distanceFromSearchKm || t.distanceNum || 5) <= 10.0
          );
        } else if (params.distance === 'above10') {
          trails = trails.filter((t) => (t.distanceFromSearchKm || t.distanceNum || 5) > 10.0);
        }
      }

      // Apply sorting (distance from searched location)
      if (params.sortBy === 'distance') {
        trails.sort((a, b) => (a.distanceFromSearchKm || 9999) - (b.distanceFromSearchKm || 9999));
      } else if (params.sortBy === 'name') {
        trails.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else {
        // Default sort by rating descending
        trails.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      return {
        success: true,
        searchLocation: res.searchLocation || res.location,
        location: res.location || res.searchLocation,
        userLocation: res.userLocation,
        distanceFromUserToSearchKm: res.distanceFromUserToSearchKm,
        distanceFromUserToSearch: res.distanceFromUserToSearch,
        distanceFromUserToSearchText: res.distanceFromUserToSearchText,
        count: trails.length,
        results: trails,
        data: trails
      };
    }

    // When no search active, fetch popular / curated trails
    const query = new URLSearchParams();
    if (params.difficulty && params.difficulty !== 'all') query.append('difficulty', params.difficulty);
    if (params.distance && params.distance !== 'all') query.append('distance', params.distance);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.lat != null && params.lng != null) {
      query.append('lat', params.lat);
      query.append('lng', params.lng);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return await apiRequest(`/trails/popular${qs}`);
  },

  async getPopularTrails(params = {}) {
    const query = new URLSearchParams();
    if (params.lat != null && params.lng != null) {
      query.append('lat', params.lat);
      query.append('lng', params.lng);
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await apiRequest(`/trails/popular${qs}`);
  },

  /**
   * Dynamic Nearby Trails Search via Overpass API
   */
  async getNearbyTrails(lat, lng, radius = 25) {
    return await apiRequest(`/explore/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },

  async getTrailById(id, queryParams = {}) {
    const query = new URLSearchParams();
    if (queryParams.name) query.append('name', queryParams.name);
    if (queryParams.city) query.append('city', queryParams.city);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await apiRequest(`/trails/${id}${qs}`);
  },

  async createTrail(trailData) {
    return await apiRequest('/trails', {
      method: 'POST',
      body: JSON.stringify(trailData)
    });
  },

  async updateTrail(id, trailData) {
    return await apiRequest(`/trails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trailData)
    });
  },

  async deleteTrail(id) {
    return await apiRequest(`/trails/${id}`, {
      method: 'DELETE'
    });
  }
};

export default trailService;
