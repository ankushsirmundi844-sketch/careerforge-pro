import { create } from 'zustand';
import api from '../utils/api';

const useResumeStore = create((set, get) => ({
  resumes: [],
  activeResume: null,
  atsScore: 0,
  extractedKeywords: [],
  isLoading: false,

  fetchResumes: async () => {
    set({ isLoading: true });
    const res = await api.get('/resume');
    set({ resumes: res.data, isLoading: false });
  },

  fetchResume: async (id) => {
    const res = await api.get(`/resume/${id}`);
    set({ activeResume: res.data });
    return res.data;
  },

  createResume: async (data) => {
    const res = await api.post('/resume', data);
    set((state) => ({ resumes: [res.data, ...state.resumes] }));
    return res.data;
  },

  updateResume: async (id, data) => {
    const res = await api.put(`/resume/${id}`, data);
    set((state) => ({
      resumes: state.resumes.map((r) => (r._id === id ? res.data : r)),
      activeResume: res.data,
    }));
    return res.data;
  },

  deleteResume: async (id) => {
    await api.delete(`/resume/${id}`);
    set((state) => ({ resumes: state.resumes.filter((r) => r._id !== id) }));
  },

  // Update a field in the active resume (local, before save)
  updateField: (path, value) => {
    const resume = { ...get().activeResume };
    const keys = path.split('.');
    let obj = resume;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    set({ activeResume: resume });
  },

  optimizeResume: async (id, jobDescription) => {
    const res = await api.post(`/ai/optimize-resume/${id}`, { jobDescription });
    set({ activeResume: res.data.resume, atsScore: res.data.atsScore, extractedKeywords: res.data.resume.extractedKeywords });
    return res.data;
  },

  getATSScore: async (id, jobDescription) => {
    const res = await api.post(`/ai/ats-score/${id}`, { jobDescription });
    set({ atsScore: res.data.score, extractedKeywords: res.data.keywords });
    return res.data;
  },

  downloadPDF: async (id) => {
    const res = await api.post(`/resume/${id}/download-pdf`, {}, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CareerForge_Resume.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  },
}));

export default useResumeStore;
