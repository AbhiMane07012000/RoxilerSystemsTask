import api from "./api";

export const submitRating = async (data) => {
  const response = await api.post("/ratings", data);
  return response.data;
};

export const updateRating = async (storeId, data) => {
  const response = await api.put(`/ratings/${storeId}`, data);
  return response.data;
};