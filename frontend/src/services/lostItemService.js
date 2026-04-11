import axios from "axios";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getItems = async (params = {}) => {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return axios.get(`${API}/lost-items`, { params, headers });
};

export const createItem = async (data, token) => {
  return axios.post(`${API}/lost-items`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};