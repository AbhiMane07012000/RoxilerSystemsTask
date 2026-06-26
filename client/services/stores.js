import api from "./api";

export const getStores = async (params) => {
  const response = await api.get("/stores", { params });
  return response.data;
};

export const createStore = async (data) => {
  const response = await api.post("/stores", data);
  return response.data;
};