import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8080/api/v1' : '/api/v1');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach genuine JWT Bearer Token to all outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: Handle 401 Unauthorized from backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Backend rejected request: 401 Unauthorized (JWT Invalid or Expired)');
      localStorage.removeItem('token');
      localStorage.removeItem('aura_ner_user');
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Real Database Auth Endpoints
  login: (username, password) => apiClient.post('/auth/login', { username, password }),
  register: (userData) => apiClient.post('/auth/register', userData),

  // Districts & Connectivity
  getDistricts: () => apiClient.get('/districts'),
  getDistrictsByState: (state) => apiClient.get(`/districts/state/${state}`),

  // Road Segments & Corridors
  getRoadSegments: () => apiClient.get('/road-segments'),
  getHighRiskSegments: (threshold = 0.5) => apiClient.get(`/road-segments/high-risk?threshold=${threshold}`),
  recalculateLiveAiRisks: () => apiClient.post('/road-segments/recalculate-live-ai'),

  // Multi-Modal Routing
  calculateRoute: (data) => apiClient.post('/routes/calculate', data),

  // Convoys & Telemetry
  getConvoys: () => apiClient.get('/convoys'),
  getActiveConvoys: () => apiClient.get('/convoys/active'),
  createConvoy: (data) => apiClient.post('/convoys', data),
  deleteConvoy: (convoyId) => apiClient.delete(`/convoys/${convoyId}`),
  completeConvoy: (convoyId) => apiClient.patch(`/convoys/${convoyId}/complete`),
  pingTelemetry: (pingData) => apiClient.post('/convoys/telemetry', pingData),

  // Incidents & Field Reporting
  getRecentIncidents: () => apiClient.get('/incidents/recent'),
  getPendingIncidents: () => apiClient.get('/incidents/pending-queue'),
  reportIncident: (incidentData) => apiClient.post('/incidents/report', incidentData),
  batchSyncIncidents: (incidents) => apiClient.post('/incidents/batch-sync', { incidents }),
  verifyIncident: (id, status, notes) => apiClient.patch(`/incidents/${id}/verify`, { verificationStatus: status, resolutionNotes: notes }),

  // e-Waybill PDF Download
  downloadEwaybill: (convoyId) => `${API_BASE_URL}/ewaybills/${convoyId}/download`,

  // Situation Report (SitRep) PDF Download
  downloadSitRepPdf: () => `${API_BASE_URL}/sitrep/download-pdf`,

  // Emergency Alerts & Broadcast Engine (SMS, WhatsApp, Push)
  broadcastAlert: (alertData) => apiClient.post('/alerts/broadcast', alertData),
  getAlertHistory: () => apiClient.get('/alerts/history'),
};

export default apiClient;
