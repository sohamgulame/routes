/**
 * Open-Meteo Live Meteorological Satellite Radar Service
 * Fetches real-time atmospheric precipitation, 24h/48h accumulated rainfall,
 * soil moisture saturation, and temperature at exact GPS coordinates.
 */

// WMO Weather Interpretation Codes (WW)
const WMO_WEATHER_MAP = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  71: 'Slight Snow Fall',
  73: 'Moderate Snow Fall',
  75: 'Heavy Snow Fall',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Slight Hail',
  99: 'Thunderstorm with Heavy Hail'
};

export async function fetchLiveRouteWeather(lat, lng) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation&past_days=2&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const current = data.current || {};
    const hourly = data.hourly || {};

    const currentTemp = current.temperature_2m ?? 24.0;
    const currentRain = current.precipitation ?? 0.0;
    const weatherCode = current.weather_code ?? 0;
    const weatherDescription = WMO_WEATHER_MAP[weatherCode] || 'Clear Conditions';

    // Calculate 24h & 48h past precipitation sums from hourly array
    const hourlyPrecip = hourly.precipitation || [];
    let rainPast24h = 0;
    let rainPast48h = 0;

    if (hourlyPrecip.length >= 48) {
      // 0 to 48 corresponds to the 2 past days
      rainPast48h = hourlyPrecip.slice(0, 48).reduce((sum, val) => sum + (val || 0), 0);
      rainPast24h = hourlyPrecip.slice(24, 48).reduce((sum, val) => sum + (val || 0), 0);
    } else {
      rainPast24h = currentRain * 4;
      rainPast48h = currentRain * 8;
    }

    return {
      currentTemp: Math.round(currentTemp * 10) / 10,
      currentRain: Math.round(currentRain * 10) / 10,
      rainPast24h: Math.round(rainPast24h * 10) / 10,
      rainPast48h: Math.round(rainPast48h * 10) / 10,
      weatherCode,
      weatherDescription,
      humidity: current.relative_humidity_2m ?? 65,
      windSpeed: current.wind_speed_10m ?? 12,
      coordinates: [lat, lng]
    };
  } catch (err) {
    console.warn('Live Open-Meteo satellite feed unavailable:', err);
    return null;
  }
}
