import axios from "axios";

const API = "http://localhost:5000/api/lost-items";

export const getItems = async () => {
  return axios.get(API);
};

export const createItem = async (data, token) => {
  return axios.post(API, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};