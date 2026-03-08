import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== ThingSpeak API ====================
// Direct calls to ThingSpeak (no backend needed)
export const thingSpeakAPI = {
  // Fetch latest data from a channel
  getLatestData: async (channelID: string, readAPIKey?: string) => {
    const url = readAPIKey
      ? `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=1`
      : `https://api.thingspeak.com/channels/${channelID}/feeds.json?results=1`;
    
    const response = await axios.get(url);
    return response.data;
  },

  // Fetch multiple entries for charts
  getHistoricalData: async (channelID: string, results: number = 100, readAPIKey?: string) => {
    const url = readAPIKey
      ? `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=${results}`
      : `https://api.thingspeak.com/channels/${channelID}/feeds.json?results=${results}`;
    
    const response = await axios.get(url);
    return response.data;
  },

  // Fetch specific field data
  getFieldData: async (channelID: string, fieldNumber: number, results: number = 100, readAPIKey?: string) => {
    const url = readAPIKey
      ? `https://api.thingspeak.com/channels/${channelID}/fields/${fieldNumber}.json?api_key=${readAPIKey}&results=${results}`
      : `https://api.thingspeak.com/channels/${channelID}/fields/${fieldNumber}.json?results=${results}`;
    
    const response = await axios.get(url);
    return response.data;
  },

  // Parse ThingSpeak feed to metrics object
  parseMetrics: (feed: any) => {
    if (!feed) return null;
    return {
      temperature: parseFloat(feed.field1) || 0,  // field1: temperature
      flow: parseInt(feed.field2) || 0,           // field2: flow (0 or 1)
      tds: parseFloat(feed.field3) || 0,          // field3: tds
      distance: parseFloat(feed.field4) || 0,     // field4: distance
      ph: parseFloat(feed.field5) || 0,           // field5: ph
      timestamp: feed.created_at,
    };
  },
};

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  signup: (name: string, email: string, password: string) =>
    api.post('/api/auth/signup', { name, email, password }),
  logout: () => api.post('/api/auth/logout'),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data: any) => api.put('/api/user/profile', data),
  getChannelData: (channelID: string, readAPIKey: string) =>
    api.get(`/api/user/channel-data/${channelID}`, {
      params: { readAPIKey },
    }),
};

// Feedback API calls
export const feedbackAPI = {
  getFeedback: () => api.get('/api/feedback'),
  submitFeedback: (data: any) => api.post('/api/feedback', data),
  updateFeedback: (id: string, data: any) => api.put(`/api/feedback/${id}`, data),
};

// Admin API calls
export const adminAPI = {
  getAllUsers: () => api.get('/api/admin/users'),
  getAllFeedback: () => api.get('/api/admin/feedback'),
  getUserHistory: (userId: string) => api.get(`/api/admin/user-history/${userId}`),
  respondToFeedback: (feedbackId: string, response: string) =>
    api.post(`/api/admin/feedback/${feedbackId}/respond`, { response }),
  updateFeedbackStatus: (feedbackId: string, status: string) =>
    api.put(`/api/admin/feedback/${feedbackId}/status`, { status }),
  deleteAdminResponse: (feedbackId: string) =>
    api.delete(`/api/admin/feedback/${feedbackId}/response`),
};

export default api;
