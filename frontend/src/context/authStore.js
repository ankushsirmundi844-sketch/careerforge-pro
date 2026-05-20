import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user, token: res.data.token, isLoading: false });
    return res.data;
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user, token: res.data.token, isLoading: false });
    return res.data;
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user });
    } catch {
      set({ user: null, token: null });
      localStorage.removeItem('token');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
