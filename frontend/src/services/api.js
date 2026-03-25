import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create axios instance with default headers
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Add token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  getProfile: () => axiosInstance.get(`/auth/profile`),
  updateProfile: (data) => axiosInstance.put(`/auth/profile`, data),
};

// Posts API
export const postsAPI = {
  getAll: (params) => axios.get(`${API_URL}/posts`, { params }),
  getFeed: (params) => axios.get(`${API_URL}/posts/feed`, { params }),
  getById: (id) => axios.get(`${API_URL}/posts/${id}`),
  getByAuthor: (authorId) => axios.get(`${API_URL}/posts/author/${authorId}`),
  create: (data) => axios.post(`${API_URL}/posts`, data),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axios.post(`${API_URL}/posts/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => axios.put(`${API_URL}/posts/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/posts/${id}`),
  like: (id) => axios.post(`${API_URL}/posts/${id}/like`),
};

// Comments API
export const commentsAPI = {
  getByPost: (postId, params) => axios.get(`${API_URL}/comments/post/${postId}`, { params }),
  create: (data) => axios.post(`${API_URL}/comments`, data),
  update: (id, data) => axios.put(`${API_URL}/comments/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/comments/${id}`),
  like: (id) => axios.post(`${API_URL}/comments/${id}/like`),
  markAccepted: (id, data) => axios.post(`${API_URL}/comments/${id}/accept`, data),
};

// Lost Items API
export const lostItemsAPI = {
  getAll: (params) => axios.get(`${API_URL}/lost-items`, { params }),
  getById: (id) => axios.get(`${API_URL}/lost-items/${id}`),
  create: (data) => axios.post(`${API_URL}/lost-items`, data),
  update: (id, data) => axios.put(`${API_URL}/lost-items/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/lost-items/${id}`),
  resolve: (id, data) => axios.post(`${API_URL}/lost-items/${id}/resolve`, data),
  addComment: (id, data) => axios.post(`${API_URL}/lost-items/${id}/comment`, data),
  flag: (id, data) => axios.post(`${API_URL}/lost-items/${id}/flag`, data),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => axios.get(`${API_URL}/admin/dashboard/stats`),
  getActivityReport: (params) => axios.get(`${API_URL}/admin/activity-report`, { params }),
  getAllPosts: (params) => axios.get(`${API_URL}/admin/posts`, { params }),
  getAllComments: (params) => axios.get(`${API_URL}/admin/comments`, { params }),
  getAllLostItems: (params) => axios.get(`${API_URL}/admin/lost-items`, { params }),
  getAllUsers: (params) => axios.get(`${API_URL}/admin/users`, { params }),
  getAdminLogs: (params) => axios.get(`${API_URL}/admin/logs`, { params }),
  suspendUser: (userId, data) => axios.post(`${API_URL}/admin/users/${userId}/suspend`, data),
  restoreUser: (userId) => axios.post(`${API_URL}/admin/users/${userId}/restore`),
};
