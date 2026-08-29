/**
 * OpenStreetMap Nominatim Live Geocoding Service
 * Enables searching any city, town, village, highway pass, or landmark in India / NER
 * and high-precision reverse-geocoding to detect live road and corridor names.
 */

const GEOCODE_CACHE = new Map();

// Comprehensive Instant Offline Database for NER & Major Indian Transit Hubs
const LOCAL_HUBS = [
  // North Eastern Region (NER) Strategic Hubs
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Dispur', state: 'Assam', lat: 26.1433, lng: 91.7898 },
  { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { name: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789 },
  { name: 'Tawang', state: 'Arunachal Pradesh', lat: 27.5860, lng: 91.8670 },
  { name: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086 },
  { name: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 93.9368 },
  { name: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065 },
  { name: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176 },
  { name: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868 },
  { name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  { name: 'Tezpur', state: 'Assam', lat: 26.6528, lng: 92.7926 },
  { name: 'Jorhat', state: 'Assam', lat: 26.7509, lng: 94.2037 },
  { name: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120 },
  { name: 'Tinsukia', state: 'Assam', lat: 27.4922, lng: 95.3468 },
  { name: 'Nagaon', state: 'Assam', lat: 26.3452, lng: 92.6840 },
  { name: 'Barpeta', state: 'Assam', lat: 26.3200, lng: 91.0000 },
  { name: 'Dhubri', state: 'Assam', lat: 26.0205, lng: 89.9744 },
  { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953 },
  { name: 'Dimapur', state: 'Nagaland', lat: 25.9095, lng: 93.7266 },
  { name: 'Dabaka', state: 'Assam', lat: 25.8833, lng: 92.8667 },
  { name: 'Lumding', state: 'Assam', lat: 25.7500, lng: 93.1700 },
  { name: 'Jowai', state: 'Meghalaya', lat: 25.4526, lng: 92.2037 },
  { name: 'Nongpoh', state: 'Meghalaya', lat: 25.9000, lng: 91.8800 },
  { name: 'Pasighat', state: 'Arunachal Pradesh', lat: 28.0667, lng: 95.3333 },
  { name: 'Churachandpur', state: 'Manipur', lat: 24.3333, lng: 93.6667 },
  { name: 'Lunglei', state: 'Mizoram', lat: 22.8833, lng: 92.7333 },
  { name: 'Mokokchung', state: 'Nagaland', lat: 26.3256, lng: 94.5244 },
  { name: 'Darjeeling', state: 'West Bengal', lat: 27.0410, lng: 88.2663 },

  // Key Western & National Logistics Centers
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
];

/**
 * Search locations matching a query string
 * @param {string} query Search text (e.g., "Tawang", "Aizawl", "Guwahati", "Pune")
 * @returns {Promise<Array<{name: string, displayName: string, lat: number, lng: number, state?: string}>>}
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();

  // 1. Instant match in local database first (0ms latency)
  const localMatches = LOCAL_HUBS.filter(
    (h) => h.name.toLowerCase().includes(cleanQuery) || h.state.toLowerCase().includes(cleanQuery)
  ).map((h) => ({
    name: h.name,
    displayName: `${h.name}, ${h.state}, India`,
    state: h.state,
    lat: h.lat,
    lng: h.lng,
  }));

  if (localMatches.length > 0) {
    return localMatches;
  }

  if (GEOCODE_CACHE.has(cleanQuery)) {
    return GEOCODE_CACHE.get(cleanQuery);
  }

  // 2. Fallback to OpenStreetMap Nominatim for street-level, landmarks or other towns
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=6&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      throw new Error(`Geocoding error: ${res.status}`);
    }

    const data = await res.json();
    const results = data.map((item) => {
      const state = item.address?.state || item.address?.state_district || '';
      const city = item.address?.city || item.address?.town || item.address?.village || item.name || item.display_name.split(',')[0];

      return {
        name: city,
        displayName: item.display_name,
        state: state,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });

    GEOCODE_CACHE.set(cleanQuery, results);
    return results;
  } catch (err) {
    console.warn('Nominatim geocoding error:', err.message);
    return [];
  }
}

/**
 * Reverse geocode a [lat, lng] to get exact road/highway/locality name
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<string>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

    const data = await res.json();
    const addr = data.address || {};
    
    // Extract road / highway / street details
    const road = addr.road || addr.highway || addr.pedestrian || addr.footway || addr.path || '';
    const locality = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    const state = addr.state || '';

    // Build specific road corridor string
    const components = [road, locality, city].filter(Boolean);
    if (components.length > 0) {
      return components.join(', ');
    }

    if (data.display_name) {
      const parts = data.display_name.split(',').map((p) => p.trim());
      return parts.slice(0, Math.min(3, parts.length)).join(', ');
    }

    return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  } catch (e) {
    console.warn('Reverse geocode error:', e);
    return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  }
}
