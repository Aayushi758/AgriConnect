/* API Service - centralized HTTP client for KisanSetu backend */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisansetu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kisansetu_token');
      localStorage.removeItem('kisansetu_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
  getFarmerProfile: () => api.get('/auth/farmer-profile'),
  updateFarmerProfile: (data: any) => api.put('/auth/farmer-profile', data),
  getConsumerProfile: () => api.get('/auth/consumer-profile'),
  updateConsumerProfile: (data: any) => api.put('/auth/consumer-profile', data),
};

// Products
export const productsAPI = {
  getCategories: () => api.get('/products/categories'),
  getMarketplace: (params?: any) => api.get('/products/marketplace', { params }),
  getMyProducts: () => api.get('/products/my-products'),
  create: (data: any) => api.post('/products/', data),
  getById: (id: number) => api.get(`/products/${id}`),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  uploadImage: (id: number, formData: FormData) =>
    api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Orders
export const ordersAPI = {
  create: (data: any) => api.post('/orders/', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getFarmerOrders: () => api.get('/orders/farmer-orders'),
  getById: (id: number) => api.get(`/orders/${id}`),
  updateStatus: (id: number, data: any) => api.put(`/orders/${id}/status`, data),
};

// Inventory
export const inventoryAPI = {
  getAll: () => api.get('/inventory/'),
  getTransactions: (productId: number) => api.get(`/inventory/${productId}/transactions`),
  addStock: (productId: number, data: any) => api.post(`/inventory/${productId}/add-stock`, data),
};

// Dashboard
export const dashboardAPI = {
  getFarmerDashboard: () => api.get('/dashboard/farmer'),
};

// Delivery
export const deliveryAPI = {
  getTracking: (orderId: number) => api.get(`/delivery/${orderId}`),
  simulateStep: (orderId: number) => api.post(`/delivery/${orderId}/simulate-step`),
};

// Chat
export const chatAPI = {
  createConversation: (data: any) => api.post('/chat/conversations', data),
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (convId: number) => api.get(`/chat/conversations/${convId}/messages`),
  sendMessage: (convId: number, data: any) => api.post(`/chat/conversations/${convId}/messages`, data),
};

// Support
export const supportAPI = {
  create: (data: any) => api.post('/support/', data),
  getAll: () => api.get('/support/'),
};

// AI / ML
export const aiAPI = {
  priceIntelligence: (data: any) => api.post('/ai/price-intelligence', data),
  pricePrediction: (crop: string, days?: number) => api.get(`/ai/price-prediction/${crop}`, { params: { days } }),
  demandForecast: (crop: string, weeks?: number) => api.get(`/ai/demand-forecast/${crop}`, { params: { weeks } }),
  cropRecommendations: (params?: any) => api.get('/ai/crop-recommendations', { params }),
  assistant: (data: any) => api.post('/ai/assistant', data),
};

// Weather
export const weatherAPI = {
  getCurrent: (location: string) => api.get(`/weather/current/${location}`),
  getForecast: (location: string, days?: number) => api.get(`/weather/forecast/${location}`, { params: { days } }),
};

// Seed
export const seedAPI = {
  seed: () => api.post('/seed'),
};

export default api;
