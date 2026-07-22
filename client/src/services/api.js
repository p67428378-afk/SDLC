import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getKpis = async () => {
  const response = await api.get("/api/v1/assortment/kpis");
  return response.data;
};

export const getSkus = async () => {
  const response = await api.get("/api/v1/assortment/skus");
  return response.data;
};

export const getScenario = async (name) => {
  const response = await api.get(`/api/v1/assortment/scenario/${name}`);
  return response.data;
};

export const submitAssortment = async (scenarioName, skuActions) => {
  const response = await api.post("/api/v1/assortment/submit", {
    scenario_name: scenarioName,
    sku_actions: skuActions,
  });
  return response.data;
};

export default api;
