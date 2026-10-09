import { apiRequest } from './api';

/**
 * Applies the Explore difficulty / distance filters and sorting to a list of trails.
 * Distance prefers distance from the searched location, then the trail's own length.
 */
export function filterAndSortTrails(trails, params = {}) {
  let list = [...trails];

  if (params.difficulty && params.difficulty !== 'all') {
    const diffLower = params.difficulty.toLowerCase();
    list = list.filter((t) => (t.difficulty || '').toLowerCase().includes(diffLower));
  }

  const getDistance = (trail) =>
    Number.isFinite(trail.distanceFromSearchKm)
      ? trail.distanceFromSearchKm
      : Number.isFinite(trail.distanceNum)
        ? trail.distanceNum
        : null;

  if (params.distance && params.distance !== 'all') {
    list = list.filter((trail) => {
      const distance = getDistance(trail);
      if (distance === null) return false;
      if (params.distance === 'under5') return distance < 5;
      if (params.distance === '5to10') return distance >= 5 && distance <= 10;
      if (params.distance === 'above10') return distance > 10;
      return true;
    });
  }

  if (params.sortBy === 'distance') {
    list.sort(
      (a, b) => (getDistance(a) ?? Number.POSITIVE_INFINITY) - (getDistance(b) ?? Number.POSITIVE_INFINITY)
    );
  } else if (params.sortBy === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (params.sortBy === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return list;
}

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

      trails = filterAndSortTrails(trails, params);

      return {
        success: true,
        searchLocation: res.searchLocation || res.location,
        location: res.location || res.searchLocation,
        userLocation: res.userLocation,
        distanceFromUserToSearchKm: res.distanceFromUserToSearchKm,
        distanceFromUserToSearch: res.distanceFromUserToSearch,
        distanceFromUserToSearchText: res.distanceFromUserToSearchText,
        sources: res.sources,
        count: trails.length,
        results: trails,
        data: trails
      };
    }

    // When no search active, fetch popular / curated trails.
    // The popular endpoint has no filter support, so filters are applied here.
    const res = await trailService.getPopularTrails(params);
    const trails = filterAndSortTrails(res.data || [], params);
    return { ...res, count: trails.length, data: trails };
  },

  // Every trail stored in the database (admin management)
  async getAllTrails() {
    return await apiRequest('/trails?sortBy=name');
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
  async getNearbyTrails(lat, lng, radius = 25, params = {}) {
    const res = await apiRequest(`/explore/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    // Nearby results arrive sorted nearest-first; only re-sort when explicitly asked to
    const trails = filterAndSortTrails(res.results || res.data || [], {
      ...params,
      sortBy: params.sortBy === 'name' ? 'name' : 'distance'
    });
    return { ...res, count: trails.length, results: trails, data: trails };
  },

  async getTrailById(id, queryParams = {}) {
    const query = new URLSearchParams();
    if (queryParams.name) query.append('name', queryParams.name);
    if (queryParams.city) query.append('city', queryParams.city);
    if (queryParams.lat != null && queryParams.lng != null) {
      query.append('lat', queryParams.lat);
      query.append('lng', queryParams.lng);
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await apiRequest(`/trails/${encodeURIComponent(id)}${qs}`);
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
