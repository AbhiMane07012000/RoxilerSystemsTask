import api from "./api";

export const getAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getUsers = async (params) => {
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/admin/users", data);
  return response.data;
};