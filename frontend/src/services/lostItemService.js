import axios from "axios";

const API = "http://localhost:5000/api/lost-items";

export const getItems = async (params = {}) => {
  return axios.get(API, { params });
};

export const createItem = async (data, token) => {
  return axios.post(API, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};