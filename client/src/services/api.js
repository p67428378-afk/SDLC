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

export const getSkus = async (cluster = "small-town-value") => {
  const response = await api.get("/api/v1/assortment/skus", {
    params: { cluster },
  });
  return response.data;
};

export const getScenario = async (scenarioName) => {
  const response = await api.get(
    `/api/v1/assortment/scenarios/${scenarioName.toLowerCase()}`,
  );
  return response.data;
};

export const submitAssortment = async (scenarioName, skuActions) => {
  const response = await api.post("/api/v1/assortment/submit", {
    scenario_name: scenarioName.toLowerCase(),
    sku_actions: skuActions,
  });
  return response.data;
};

export default api;
