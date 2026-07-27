import React, { useEffect, useState, useRef } from "react";
import { adminAPI, authAPI } from "../services/api";
import SseConnectionIndicator from "../components/banking/SseConnectionIndicator";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sseStatus, setSseStatus] = useState("connecting");

  // Audit Trail State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit] = useState(10);
  const [auditFilters, setAuditFilters] = useState({
    user_id: "",
    event_type: "",
    start_date: "",
    end_date: "",
    search: "",
  });

  // Fraud Alerts State
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [fraudTotal, setFraudTotal] = useState(0);
  const [fraudPage, setFraudPage] = useState(1);
  const [fraudLimit] = useState(5);
  const [fraudStatusFilter, setFraudStatusFilter] = useState("open");

  // Drill-down State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);

  // Verification State
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [highlightedRowId, setHighlightedRowId] = useState(null);

  // Action State
  const [actionTarget, setActionTarget] = useState(null); // { type: 'suspend'|'reactivate'|'close', accountId: string, customerId?: string }
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fraud Alert Action State
  const [alertActionTarget, setAlertActionTarget] = useState(null); // { alertId: string, action: 'resolve'|'dismiss' }
  const [alertNote, setAlertNote] = useState("");

  // Live Toasts
  const [toasts, setToasts] = useState([]);

  // Refs for scrolling
  const auditTableRef = useRef(null);
  const rowRefs = useRef({});

  useEffect(() => {
    initAdminDashboard();
  }, []);

  useEffect(() => {
    if (user) {
      if (canViewAuditTrail()) {
        fetchAuditTrail();
      }
      if (canViewFraudAlerts()) {
        fetchFraudAlerts();
      }
    }
  }, [user, auditPage, auditFilters, fraudPage, fraudStatusFilter]);

  // SSE Connection for live fraud alerts
  useEffect(() => {
    let active = true;
    let controller = new AbortController();

    const connectSSE = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSseStatus("disconnected");
        return;
      }

      try {
        setSseStatus("connecting");
        const response = await fetch(`${BASE_URL}/api/v1/banking/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("SSE connection failed");
        }

        setSseStatus("connected");
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (active) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(trimmed.slice(6));
                handleSseEvent(eventData);
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (err) {
        if (active) {
          console.error("SSE error:", err);
          setSseStatus("disconnected");
          // Retry connection after 5 seconds
          setTimeout(() => {
            if (active) connectSSE();
          }, 5000);
        }
      }
    };

    connectSSE();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const handleSseEvent = (eventData) => {
    const { event, data } = eventData;
    if (event === "new_fraud_alert") {
      // Refresh fraud alerts if on page 1
      if (fraudPage === 1) {
        fetchFraudAlerts();
      }
      // Refresh summary
      fetchSummary();
      // Add to toasts
      const newToast = {
        id: data.id || Math.random().toString(),
        title: "🚨 New Fraud Alert Triggered!",
        message: `${data.rule_triggered} (Risk Score: ${data.risk_score})`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setToasts((prev) => [newToast, ...prev]);
      // Auto-remove toast after 8 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 8000);
    }
  };

  const initAdminDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      // Fetch current user profile to determine role
      const profile = await authAPI.me();
      setUser(profile);

      // Fetch summary
      await fetchSummary();
    } catch (err) {
      setError(
        "Failed to initialize administrative dashboard. Ensure you have admin privileges.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const summaryData = await adminAPI.getAdminSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const skip = (auditPage - 1) * auditLimit;
      const params = {
        skip,
        limit: auditLimit,
        ...auditFilters,
      };
      // Clean empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "") delete params[key];
      });

      const data = await adminAPI.getAuditTrail(params);
      setAuditLogs(data.items || []);
      setAuditTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch audit trail:", err);
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const skip = (fraudPage - 1) * fraudLimit;
      const params = {
        skip,
        limit: fraudLimit,
        status: fraudStatusFilter || null,
      };
      if (!params.status) delete params.status;

      const data = await adminAPI.getFraudAlerts(params);
      setFraudAlerts(data.items || []);
      setFraudTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch fraud alerts:", err);
    }
  };

  // Role-based access control helpers
  const canViewAuditTrail = () => {
    return user && ["admin", "system_admin"].includes(user.role);
  };

  const canViewFraudAlerts = () => {
    return (
      user && ["admin", "system_admin", "fraud_analyst"].includes(user.role)
    );
  };

  const canPerformFraudActions = () => {
    return (
      user && ["admin", "system_admin", "fraud_analyst"].includes(user.role)
    );
  };

  const canPerformAccountLifecycle = (action) => {
    if (!user) return false;
    if (action === "close") {
      return ["admin", "system_admin"].includes(user.role);
    }
    return ["admin", "system_admin", "fraud_analyst"].includes(user.role);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "system_admin":
      case "admin":
        return "System Admin";
      case "fraud_analyst":
        return "Fraud Analyst";
      case "support_admin":
        return "Customer Support";
      default:
        return "Administrator";
    }
  };

  // Mask account number helper
  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return "";
    const clean = accountNumber.replace(/\s+/g, "");
    if (clean.length <= 4) return clean;
    return `•••• ${clean.slice(-4)}`;
  };

  // Export Audit Trail CSV
  const handleExportAuditCSV = async () => {
    try {
      setError("");
      setSuccessMessage("");
      const csvBlob = await adminAPI.exportAuditTrail(auditFilters);
      const url = window.URL.createObjectURL(new Blob([csvBlob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "audit-trail.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccessMessage("Audit trail exported successfully.");
    } catch (err) {
      setError("Failed to export audit trail CSV.");
    }
  };

  // Verify Audit Trail Chain
  const handleVerifyAuditTrail = async () => {
    setVerifying(true);
    setVerificationResult(null);
    setHighlightedRowId(null);
    setError("");
    setSuccessMessage("");
    try {
      const result = await adminAPI.verifyAuditTrail();
      setVerificationResult(result);
      if (result.is_intact) {
        setSuccessMessage(
          "Audit trail verification passed: Cryptographic hash chain is fully intact.",
        );
      } else {
        setError(
          `Audit trail verification failed! Tampering detected at record: ${result.first_tampered_record_id}`,
        );
        if (result.first_tampered_record_id) {
          setHighlightedRowId(result.first_tampered_record_id);
          // Scroll to the tampered row
          setTimeout(() => {
            const element = rowRefs.current[result.first_tampered_record_id];
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 300);
        }
      }
    } catch (err) {
      setError("Failed to verify audit trail integrity.");
    } finally {
      setVerifying(false);
    }
  };

  // Customer Drill-down
  const handleCustomerClick = async (userId) => {
    setCustomerLoading(true);
    setError("");
    try {
      const data = await adminAPI.getCustomerDetail(userId);
      setSelectedCustomer(data);
    } catch (err) {
      setError("Failed to load customer details.");
    } finally {
      setCustomerLoading(false);
    }
  };

  // Account Drill-down
  const handleAccountClick = async (accountId) => {
    setAccountLoading(true);
    setError("");
    try {
      const data = await adminAPI.getAccountDetail(accountId);
      setSelectedAccount(data);
    } catch (err) {
      setError("Failed to load account details.");
    } finally {
      setAccountLoading(false);
    }
  };

  // Account Lifecycle Actions
  const handleLifecycleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionReason.trim()) {
      alert("Please provide a reason for this action.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const { type, accountId, customerId } = actionTarget;
      let response;
      if (type === "suspend") {
        response = await adminAPI.suspendAccount(accountId, actionReason);
        setSuccessMessage(
          `Account ${maskAccountNumber(accountId)} has been suspended.`,
        );
      } else if (type === "reactivate") {
        response = await adminAPI.reactivateAccount(accountId, actionReason);
        setSuccessMessage(
          `Account ${maskAccountNumber(accountId)} has been reactivated.`,
        );
      } else if (type === "close") {
        response = await adminAPI.closeAccount(accountId, actionReason);
        setSuccessMessage(
          `Account ${maskAccountNumber(accountId)} has been closed.`,
        );
      }

      // Refresh drill-down views if open
      if (selectedCustomer && customerId) {
        await handleCustomerClick(customerId);
      }
      if (selectedAccount && selectedAccount.account.id === accountId) {
        await handleAccountClick(accountId);
      }

      // Refresh summary and lists
      await fetchSummary();
      if (canViewFraudAlerts()) await fetchFraudAlerts();
      if (canViewAuditTrail()) await fetchAuditTrail();

      // Close modal
      setActionTarget(null);
      setActionReason("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to perform account lifecycle action.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Fraud Alert Actions
  const handleFraudAlertActionSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const { alertId, action } = alertActionTarget;
      await adminAPI.updateFraudAlert(alertId, {
        status: action === "resolve" ? "resolved" : "dismissed",
        note: alertNote || null,
      });

      setSuccessMessage(
        `Fraud alert has been ${action === "resolve" ? "resolved" : "dismissed"}.`,
      );

      // Refresh lists
      await fetchSummary();
      await fetchFraudAlerts();
      if (canViewAuditTrail()) await fetchAuditTrail();

      // Close modal
      setAlertActionTarget(null);
      setAlertNote("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update fraud alert.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setAuditFilters((prev) => ({ ...prev, [name]: value }));
    setAuditPage(1);
  };

  const handleClearFilters = () => {
    setAuditFilters({
      user_id: "",
      event_type: "",
      start_date: "",
      end_date: "",
      search: "",
    });
    setAuditPage(1);
  };

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
        aria-busy="true"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 text-sm font-medium">
          Loading Administrative Control Center...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Live Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-800 flex flex-col gap-1 animate-bounce pointer-events-auto"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm text-indigo-400">
                {toast.title}
              </span>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-slate-400 hover:text-white text-xs font-bold"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300">{toast.message}</p>
            <span className="text-[10px] text-slate-500 self-end">
              {toast.timestamp}
            </span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Administrative Control Center
            </h1>
            {user && (
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                {getRoleDisplayName(user.role)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor system activities, audit trails, and potential security
            risks
          </p>
        </div>
        <SseConnectionIndicator status={sseStatus} />
      </div>

      {error && (
        <div
          className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2"
          role="alert"
        >
          <span>⚠️</span>
          <p className="font-medium">{error}</p>
        </div>
      )}

      {successMessage && (
        <div
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2"
          role="status"
        >
          <span>✅</span>
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* KPI Summary Strip */}
      {summary && (
        <section
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          aria-label="Key Performance Indicators"
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-2">
              {summary.total_customers}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Fraud Alerts
            </span>
            <span className="text-2xl font-bold text-rose-600 mt-2">
              {summary.open_fraud_alerts}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Suspended Accounts
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-2">
              {summary.suspended_accounts}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Transactions (24h)
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-2">
              {summary.transactions_24h}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Audit Chain Status
            </span>
            <span
              className={`text-sm font-bold mt-2 px-2.5 py-1 rounded-lg text-center border ${
                summary.audit_chain_intact
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {summary.audit_chain_intact ? "Chain Intact" : "Tampered!"}
            </span>
          </div>
        </section>
      )}

      {/* Fraud Alerts Section */}
      {canViewFraudAlerts() && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Potential Risk & Fraudulent Activities
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time monitoring of high-risk transactions and alerts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="fraud-status-filter"
                className="text-xs font-semibold text-slate-500 uppercase"
              >
                Status:
              </label>
              <select
                id="fraud-status-filter"
                value={fraudStatusFilter}
                onChange={(e) => {
                  setFraudStatusFilter(e.target.value);
                  setFraudPage(1);
                }}
                className="py-1.5 pl-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="">All Alerts</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {fraudAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No fraud alerts detected matching the criteria.
              </div>
            ) : (
              fraudAlerts.map((alertItem) => {
                const isHighRisk = alertItem.risk_score >= 80;
                const riskColor = isHighRisk
                  ? "text-rose-600 bg-rose-50 border-rose-200"
                  : "text-amber-600 bg-amber-50 border-amber-200";

                return (
                  <div
                    key={alertItem.id}
                    className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${riskColor}`}
                        >
                          Risk Score: {alertItem.risk_score}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {alertItem.rule_triggered}
                        </span>
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                            alertItem.status === "open"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : alertItem.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {alertItem.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <p>
                          Alert ID:{" "}
                          <span className="font-mono text-slate-700">
                            {alertItem.id}
                          </span>
                        </p>
                        <p>
                          Transaction ID:{" "}
                          <span className="font-mono text-slate-700">
                            {alertItem.transaction_id}
                          </span>
                        </p>
                        <p>
                          Amount:{" "}
                          <span className="font-semibold text-slate-900">
                            ${alertItem.transaction?.amount?.toFixed(2)}
                          </span>
                        </p>
                        <p>
                          Source Account ID:{" "}
                          <button
                            onClick={() =>
                              handleAccountClick(
                                alertItem.transaction?.source_account_id,
                              )
                            }
                            className="font-mono text-indigo-600 hover:underline font-semibold"
                            aria-label={`View details for account ${maskAccountNumber(alertItem.transaction?.source_account_id)}`}
                          >
                            {maskAccountNumber(
                              alertItem.transaction?.source_account_id,
                            )}
                          </button>
                        </p>
                        {alertItem.note && (
                          <p className="col-span-2 bg-slate-50 p-2 rounded border border-slate-100 mt-1 text-slate-600">
                            <span className="font-semibold text-slate-700">
                              Note:
                            </span>{" "}
                            {alertItem.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {canPerformFraudActions() &&
                      alertItem.status === "open" && (
                        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                          <button
                            onClick={() =>
                              setAlertActionTarget({
                                alertId: alertItem.id,
                                action: "resolve",
                              })
                            }
                            className="bg-emerald-600 text-white py-1.5 px-4 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() =>
                              setAlertActionTarget({
                                alertId: alertItem.id,
                                action: "dismiss",
                              })
                            }
                            className="bg-slate-600 text-white py-1.5 px-4 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </div>

          {/* Fraud Alerts Pagination */}
          {fraudTotal > fraudLimit && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Showing {(fraudPage - 1) * fraudLimit + 1} to{" "}
                {Math.min(fraudPage * fraudLimit, fraudTotal)} of {fraudTotal}{" "}
                alerts
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFraudPage((p) => Math.max(p - 1, 1))}
                  disabled={fraudPage === 1}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFraudPage((p) => p + 1)}
                  disabled={fraudPage * fraudLimit >= fraudTotal}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* System Audit Trail Section */}
      {canViewAuditTrail() && (
        <section
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          ref={auditTableRef}
        >
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  System Audit Trail
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Immutable log of all customer and administrator activities
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleVerifyAuditTrail}
                  disabled={verifying}
                  className="bg-indigo-600 text-white py-1.5 px-4 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {verifying ? "Verifying Chain..." : "Verify Chain"}
                </button>
                <button
                  onClick={handleExportAuditCSV}
                  className="bg-white border border-slate-300 text-slate-700 py-1.5 px-4 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1"
                >
                  <span>📥</span> Export Audit CSV
                </button>
              </div>
            </div>

            {/* Audit Trail Verification Result Banner */}
            {verificationResult && (
              <div
                className={`p-4 rounded-xl border text-sm ${
                  verificationResult.is_intact
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
                role="alert"
              >
                {verificationResult.is_intact ? (
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <p className="font-semibold">
                      Audit Trail Verified: Cryptographic hash chain is fully
                      intact and tamper-evident.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <span>🚨</span>
                      <p>WARNING: Audit Trail Tampering Detected!</p>
                    </div>
                    <p>
                      First tampered record ID:{" "}
                      <span className="font-mono font-bold">
                        {verificationResult.first_tampered_record_id}
                      </span>
                    </p>
                    {verificationResult.details && (
                      <p className="text-xs opacity-90">
                        Details: {verificationResult.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div>
                <label
                  htmlFor="filter-user-id"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  User ID
                </label>
                <input
                  id="filter-user-id"
                  type="text"
                  name="user_id"
                  value={auditFilters.user_id}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Filter by User ID"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-event-type"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Event Type
                </label>
                <input
                  id="filter-event-type"
                  type="text"
                  name="event_type"
                  value={auditFilters.event_type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. USER_LOGIN"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-start-date"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Start Date
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  name="start_date"
                  value={auditFilters.start_date}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-end-date"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  End Date
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  name="end_date"
                  value={auditFilters.end_date}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-search"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Keyword Search
                </label>
                <div className="flex gap-2">
                  <input
                    id="filter-search"
                    type="text"
                    name="search"
                    value={auditFilters.search}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Search details, IP..."
                  />
                  <button
                    onClick={handleClearFilters}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    title="Clear all filters"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600 tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Source IP</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-12 text-center text-slate-400"
                    >
                      No audit logs found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const isHighlighted = highlightedRowId === log.id;
                    return (
                      <tr
                        key={log.id}
                        ref={(el) => (rowRefs.current[log.id] = el)}
                        className={`transition-all duration-500 ${
                          isHighlighted
                            ? "bg-rose-100 hover:bg-rose-200 font-semibold text-rose-900 ring-2 ring-rose-500 ring-inset"
                            : "hover:bg-slate-50/50"
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <button
                            onClick={() => handleCustomerClick(log.user_id)}
                            className="text-indigo-600 hover:underline font-semibold"
                            aria-label={`View details for customer ${log.user_id}`}
                          >
                            {log.user_id}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded font-semibold border border-indigo-100">
                            {log.event_type}
                          </span>
                        </td>
                        <td
                          className="py-3 px-4 max-w-xs truncate text-slate-600"
                          title={JSON.stringify(log.event_details)}
                        >
                          {typeof log.event_details === "object"
                            ? JSON.stringify(log.event_details)
                            : log.event_details}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          {log.source_ip}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Audit Trail Pagination */}
          {auditTotal > auditLimit && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Showing {(auditPage - 1) * auditLimit + 1} to{" "}
                {Math.min(auditPage * auditLimit, auditTotal)} of {auditTotal}{" "}
                logs
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setAuditPage((p) => Math.max(p - 1, 1))}
                  disabled={auditPage === 1}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setAuditPage((p) => p + 1)}
                  disabled={auditPage * auditLimit >= auditTotal}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Customer Drill-down Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3
                  id="customer-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Customer Profile Drill-down
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed administrative view of customer profile, accounts,
                  and activities
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Full Name
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {selectedCustomer.profile.full_name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Username
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {selectedCustomer.profile.username}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Email
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {selectedCustomer.profile.email}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Status
                  </span>
                  <p className="mt-0.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        selectedCustomer.profile.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {selectedCustomer.profile.is_active
                        ? "Active"
                        : "Suspended"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Accounts List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Accounts & Balances
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCustomer.accounts.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-2">
                      No accounts found for this customer.
                    </p>
                  ) : (
                    selectedCustomer.accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-slate-800 uppercase">
                              {acc.account_type}
                            </span>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">
                              {maskAccountNumber(acc.account_number)}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                              acc.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : acc.status === "suspended"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {acc.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">
                              Balance
                            </span>
                            <p className="text-lg font-bold text-slate-900">
                              ${acc.balance.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            {acc.status === "active" &&
                              canPerformAccountLifecycle("suspend") && (
                                <button
                                  onClick={() =>
                                    setActionTarget({
                                      type: "suspend",
                                      accountId: acc.id,
                                      customerId: selectedCustomer.profile.id,
                                    })
                                  }
                                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-1 px-2.5 rounded transition-colors"
                                >
                                  Suspend
                                </button>
                              )}
                            {acc.status === "suspended" &&
                              canPerformAccountLifecycle("reactivate") && (
                                <button
                                  onClick={() =>
                                    setActionTarget({
                                      type: "reactivate",
                                      accountId: acc.id,
                                      customerId: selectedCustomer.profile.id,
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1 px-2.5 rounded transition-colors"
                                >
                                  Reactivate
                                </button>
                              )}
                            {acc.status !== "closed" &&
                              canPerformAccountLifecycle("close") && (
                                <button
                                  onClick={() =>
                                    setActionTarget({
                                      type: "close",
                                      accountId: acc.id,
                                      customerId: selectedCustomer.profile.id,
                                    })
                                  }
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-1 px-2.5 rounded transition-colors"
                                >
                                  Close
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Transactions
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedCustomer.recent_transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-4 text-center text-slate-400"
                          >
                            No transactions found.
                          </td>
                        </tr>
                      ) : (
                        selectedCustomer.recent_transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono">
                              {tx.transaction_date.split("T")[0]}
                            </td>
                            <td className="py-2 px-3 capitalize">{tx.type}</td>
                            <td className="py-2 px-3 font-medium">
                              {tx.description || "No description"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">
                              ${tx.amount.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                  tx.status.toLowerCase() === "completed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Events */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Audit Events
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3">Event Type</th>
                        <th className="py-2 px-3">Details</th>
                        <th className="py-2 px-3">Source IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedCustomer.audit_events.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="py-4 text-center text-slate-400"
                          >
                            No audit events found.
                          </td>
                        </tr>
                      ) : (
                        selectedCustomer.audit_events.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-2 px-3">
                              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold border border-indigo-100">
                                {log.event_type}
                              </span>
                            </td>
                            <td
                              className="py-2 px-3 max-w-xs truncate"
                              title={JSON.stringify(log.event_details)}
                            >
                              {typeof log.event_details === "object"
                                ? JSON.stringify(log.event_details)
                                : log.event_details}
                            </td>
                            <td className="py-2 px-3 font-mono">
                              {log.source_ip}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold py-2 px-5 rounded-xl transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3
                  id="account-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Account Detail View
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed administrative view of account status, owner, and
                  transactions
                </p>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Account & Owner Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Account Details
                  </h4>
                  <div className="text-sm space-y-1 text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-500">
                        Type:
                      </span>{" "}
                      {selectedAccount.account.account_type}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Number:
                      </span>{" "}
                      <span className="font-mono">
                        {maskAccountNumber(
                          selectedAccount.account.account_number,
                        )}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Balance:
                      </span>{" "}
                      <span className="font-bold text-slate-900">
                        ${selectedAccount.account.balance.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Status:
                      </span>{" "}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          selectedAccount.account.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {selectedAccount.account.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Owner Details
                  </h4>
                  <div className="text-sm space-y-1 text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-500">
                        Name:
                      </span>{" "}
                      {selectedAccount.owner.full_name}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Username:
                      </span>{" "}
                      {selectedAccount.owner.username}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Email:
                      </span>{" "}
                      {selectedAccount.owner.email}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        User Status:
                      </span>{" "}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          selectedAccount.owner.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {selectedAccount.owner.is_active
                          ? "Active"
                          : "Suspended"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Lifecycle Actions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Account Lifecycle Management
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedAccount.account.status === "active" &&
                    canPerformAccountLifecycle("suspend") && (
                      <button
                        onClick={() =>
                          setActionTarget({
                            type: "suspend",
                            accountId: selectedAccount.account.id,
                          })
                        }
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
                      >
                        Suspend Account
                      </button>
                    )}
                  {selectedAccount.account.status === "suspended" &&
                    canPerformAccountLifecycle("reactivate") && (
                      <button
                        onClick={() =>
                          setActionTarget({
                            type: "reactivate",
                            accountId: selectedAccount.account.id,
                          })
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
                      >
                        Reactivate Account
                      </button>
                    )}
                  {selectedAccount.account.status !== "closed" &&
                    canPerformAccountLifecycle("close") && (
                      <button
                        onClick={() =>
                          setActionTarget({
                            type: "close",
                            accountId: selectedAccount.account.id,
                          })
                        }
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
                      >
                        Close Account Permanently
                      </button>
                    )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Transactions
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedAccount.recent_transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-4 text-center text-slate-400"
                          >
                            No transactions found.
                          </td>
                        </tr>
                      ) : (
                        selectedAccount.recent_transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono">
                              {tx.transaction_date.split("T")[0]}
                            </td>
                            <td className="py-2 px-3 capitalize">{tx.type}</td>
                            <td className="py-2 px-3 font-medium">
                              {tx.description || "No description"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">
                              ${tx.amount.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                  tx.status.toLowerCase() === "completed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedAccount(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold py-2 px-5 rounded-xl transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Lifecycle Action Confirmation Modal */}
      {actionTarget && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lifecycle-modal-title"
        >
          <form
            onSubmit={handleLifecycleActionSubmit}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h3
                id="lifecycle-modal-title"
                className="text-lg font-bold text-slate-900 capitalize"
              >
                Confirm Account {actionTarget.type}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Are you sure you want to {actionTarget.type} this account? This
                action is audited.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-500">
                    Account ID:
                  </span>{" "}
                  <span className="font-mono font-bold">
                    {maskAccountNumber(actionTarget.accountId)}
                  </span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="action-reason"
                  className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Reason for {actionTarget.type}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="action-reason"
                  required
                  rows="3"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder={`Provide a detailed reason for account ${actionTarget.type}...`}
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionTarget(null);
                  setActionReason("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={`text-white text-sm font-semibold py-2 px-5 rounded-xl transition-colors shadow-sm ${
                  actionTarget.type === "suspend"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : actionTarget.type === "reactivate"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionLoading
                  ? "Processing..."
                  : `Confirm ${actionTarget.type}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fraud Alert Action Modal */}
      {alertActionTarget && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fraud-modal-title"
        >
          <form
            onSubmit={handleFraudAlertActionSubmit}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h3
                id="fraud-modal-title"
                className="text-lg font-bold text-slate-900 capitalize"
              >
                Confirm Fraud Alert {alertActionTarget.action}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Are you sure you want to mark this fraud alert as{" "}
                {alertActionTarget.action === "resolve"
                  ? "resolved"
                  : "dismissed"}
                ?
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-500">
                    Alert ID:
                  </span>{" "}
                  <span className="font-mono font-bold">
                    {alertActionTarget.alertId}
                  </span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="alert-note"
                  className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Add Note / Resolution Details
                </label>
                <textarea
                  id="alert-note"
                  rows="3"
                  value={alertNote}
                  onChange={(e) => setAlertNote(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Add any notes or resolution details here..."
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAlertActionTarget(null);
                  setAlertNote("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={`text-white text-sm font-semibold py-2 px-5 rounded-xl transition-colors shadow-sm ${
                  alertActionTarget.action === "resolve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-600 hover:bg-slate-700"
                }`}
              >
                {actionLoading
                  ? "Processing..."
                  : `Confirm ${alertActionTarget.action}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
