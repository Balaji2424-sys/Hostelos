import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hostel_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hostel_token');
      localStorage.removeItem('hostel_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const register = (data: any) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRoomMap = () => api.get('/dashboard/room-map');

// Rooms
export const getRooms = (params?: any) => api.get('/rooms', { params });
export const getRoom = (id: string) => api.get(`/rooms/${id}`);
export const createRoom = (data: any) => api.post('/rooms', data);
export const updateRoom = (id: string, data: any) => api.put(`/rooms/${id}`, data);
export const getVacantBeds = () => api.get('/rooms/vacant/beds');

// Tenants
export const getTenants = (params?: any) => api.get('/tenants', { params });
export const getTenant = (id: string) => api.get(`/tenants/${id}`);
export const createTenant = (data: any) => api.post('/tenants', data);
export const updateTenant = (id: string, data: any) => api.put(`/tenants/${id}`, data);
export const vacateTenant = (id: string) => api.post(`/tenants/${id}/vacate`);
export const getUpcomingVacates = () => api.get('/tenants/upcoming/vacates');

// Payments
export const getPayments = (params?: any) => api.get('/payments', { params });
export const getPaymentSummary = () => api.get('/payments/summary');
export const getPaymentTrend = () => api.get('/payments/trend');
export const recordPayment = (id: string, data: any) => api.post(`/payments/${id}/record`, data);
export const initiateFakePayment = (data: any) => api.post('/payments/fake/initiate', data);
export const verifyFakePayment = (data: any) => api.post('/payments/fake/verify', data);
export const generateMonthlyPayments = (data: any) => api.post('/payments/generate-monthly', data);

// Electricity
export const getEbBills = (params?: any) => api.get('/electricity', { params });
export const createEbBill = (data: any) => api.post('/electricity', data);
export const getEbTrend = () => api.get('/electricity/trend');
export const payEbSplit = (id: string) => api.put(`/electricity/splits/${id}/pay`);

// Complaints
export const getComplaints = (params?: any) => api.get('/complaints', { params });
export const createComplaint = (data: any) => api.post('/complaints', data);
export const updateComplaint = (id: string, data: any) => api.put(`/complaints/${id}`, data);
export const getComplaintSummary = () => api.get('/complaints/summary');

// AI
export const aiChat = (message: string, context?: any) => api.post('/ai/chat', { message, context });
export const getPaymentRisk = () => api.get('/ai/payment-risk');
export const getVacancyForecast = () => api.get('/ai/vacancy-forecast');
export const draftMessage = (type: string, tenantId: string) => api.post('/ai/draft-message', { type, tenantId });
export const getEbAnomalies = () => api.get('/ai/eb-anomaly');

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotifRead = (id: string) => api.put(`/notifications/${id}/read`);
export const markAllRead = () => api.put('/notifications/read-all');

// Reports
export const getRentCollectionReport = (params?: any) => api.get('/reports/rent-collection', { params });
export const getOccupancyReport = () => api.get('/reports/occupancy');
export const getUnpaidTenantsReport = (params?: any) => api.get('/reports/unpaid-tenants', { params });
export const getAnnualReport = (year?: number) => api.get('/reports/annual', { params: { year } });

// Hostel setup
export const getHostels = () => api.get('/hostels');
export const createHostel = (data: any) => api.post('/hostels', data);
export const createBlock = (hostelId: string, data: any) => api.post(`/hostels/${hostelId}/blocks`, data);
export const createFloor = (blockId: string, data: any) => api.post(`/hostels/blocks/${blockId}/floors`, data);
