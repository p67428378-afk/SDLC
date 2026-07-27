import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const authAPI = {
  register: async (data) => {
    const response = await api.post("/api/v1/banking/auth/register", data);
    return response.data;
  },
  login: async (data) => {
    const response = await api.post("/api/v1/banking/auth/login", data);
    if (response.data && response.data.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },
  logout: async () => {
    try {
      await api.post("/api/v1/banking/auth/logout");
    } finally {
      localStorage.removeItem("token");
    }
  },
  me: async () => {
    const response = await api.get("/api/v1/banking/auth/me");
    return response.data;
  },
};

export const bankingAPI = {
  getAccounts: async () => {
    const response = await api.get("/api/v1/banking/accounts");
    return response.data;
  },
  getAccountDetails: async (accountId) => {
    const response = await api.get(`/api/v1/banking/accounts/${accountId}`);
    return response.data;
  },
  getStatements: async (accountId) => {
    const response = await api.get(
      `/api/v1/banking/accounts/${accountId}/statements`,
    );
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put("/api/v1/banking/profile", data);
    return response.data;
  },
  updatePreferences: async (data) => {
    const response = await api.put("/api/v1/banking/preferences", data);
    return response.data;
  },
  getTransactions: async (accountId, params = {}) => {
    const response = await api.get(
      `/api/v1/banking/accounts/${accountId}/transactions`,
      { params },
    );
    return response.data;
  },
  transferFunds: async (data) => {
    const response = await api.post("/api/v1/banking/transfers", data);
    return response.data;
  },
  exportTransactions: async (accountId, params = {}) => {
    const response = await api.get(
      `/api/v1/banking/accounts/${accountId}/transactions/export`,
      {
        params: { ...params, format: "csv" },
        responseType: "blob",
      },
    );
    return response.data;
  },
  downloadStatement: async (filename) => {
    const response = await api.get(`/api/v1/banking/statements/${filename}`, {
      responseType: "blob",
    });
    return response.data;
  },
};

export const adminAPI = {
  getAuditTrail: async (params = {}) => {
    const response = await api.get("/api/v1/banking/admin/audit-trail", {
      params,
    });
    return response.data;
  },
  getFraudAlerts: async (params = {}) => {
    const response = await api.get("/api/v1/banking/admin/fraud-alerts", {
      params,
    });
    return response.data;
  },
  suspendAccount: async (accountId, reason) => {
    const response = await api.post(
      `/api/v1/banking/admin/accounts/${accountId}/suspend`,
      { reason },
    );
    return response.data;
  },
  verifyAuditTrail: async () => {
    const response = await api.get("/api/v1/banking/admin/audit-trail/verify");
    return response.data;
  },
};

export default api;
