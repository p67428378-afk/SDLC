import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import AuditTrailTable from "../components/banking/AuditTrailTable";
import FraudAlertList from "../components/banking/FraudAlertList";

export default function AdminDashboardPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const auditData = await adminAPI.getAuditTrail();
      setAuditLogs(auditData.items || []);

      const fraudData = await adminAPI.getFraudAlerts();
      setFraudAlerts(fraudData.items || []);
    } catch (err) {
      setError(
        "Failed to load administrative data. Ensure you have admin privileges.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendAccount = async (accountId, reason) => {
    setError("");
    setSuccessMessage("");
    try {
      await adminAPI.suspendAccount(accountId, reason);
      setSuccessMessage(`Account ${accountId} has been temporarily suspended.`);
      // Refresh data
      await fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to suspend account.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Administrative Control Center
        </h1>
        <p className="text-sm text-slate-500">
          Monitor system activities, audit trails, and potential security risks
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-8">
        <FraudAlertList
          alerts={fraudAlerts}
          onSuspendAccount={handleSuspendAccount}
        />
        <AuditTrailTable logs={auditLogs} />
      </section>
    </div>
  );
}
