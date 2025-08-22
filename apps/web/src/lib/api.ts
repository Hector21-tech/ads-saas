import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  city: string;
  radiusKm: number;
  budgetKr: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ads: number;
  };
}

export const authApi = {
  register: async (data: { email: string; password: string; name?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const campaignApi = {
  list: async (): Promise<Campaign[]> => {
    const response = await api.get('/campaigns');
    return response.data;
  },

  create: async (data: {
    name: string;
    city: string;
    radiusKm: number;
    budgetKr: number;
    startDate: string;
    endDate: string;
  }) => {
    const response = await api.post('/campaigns', data);
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  },
};