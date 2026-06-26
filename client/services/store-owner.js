import api from "./api";

export const getOwnerDashboard = async () => {
  const response = await api.get("/store-owner/dashboard");
  return response.data;
};

export const getStoreRatings = async (storeId) => {
  const response = await api.get(`/store-owner/ratings/${storeId}`);
  return response.data;
};