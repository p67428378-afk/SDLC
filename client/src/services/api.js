import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getKPIs = async () => {
  const response = await api.get("/api/v1/kpis");
  return response.data;
};

export const getSKUsPerformance = async (params = {}) => {
  const response = await api.get("/api/v1/skus/performance", { params });
  return response.data;
};

export const getScenario = async (scenarioName) => {
  const response = await api.get(`/api/v1/scenarios/${scenarioName}`);
  return response.data;
};

export const submitAssortment = async (payload) => {
  const response = await api.post("/api/v1/assortment/submit", payload);
  return response.data;
};

export default api;
