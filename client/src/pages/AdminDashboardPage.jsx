import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import AuditTrailTable from "../components/banking/AuditTrailTable";
import FraudAlertList from "../components/banking/FraudAlertList";
import SseConnectionIndicator from "../components/banking/SseConnectionIndicator";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function AdminDashboardPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sseStatus, setSseStatus] = useState("connecting");

  // Audit trail verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

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
      setFraudAlerts((prevAlerts) => {
        if (prevAlerts.some((a) => a.id === data.id)) return prevAlerts;
        return [data, ...prevAlerts];
      });
    }
  };

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

  const handleVerifyAuditTrail = async () => {
    setVerifying(true);
    setVerificationResult(null);
    setError("");
    try {
      const result = await adminAPI.verifyAuditTrail();
      setVerificationResult(result);
    } catch (err) {
      setError("Failed to verify audit trail integrity.");
    } finally {
      setVerifying(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Administrative Control Center
          </h1>
          <p className="text-sm text-slate-500">
            Monitor system activities, audit trails, and potential security
            risks
          </p>
        </div>
        <SseConnectionIndicator status={sseStatus} />
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

      {/* Audit Trail Verification Section */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Audit Trail Integrity Verification
            </h2>
            <p className="text-xs text-slate-500">
              Walk the cryptographic hash chain to verify that no records have
              been tampered with.
            </p>
          </div>
          <button
            onClick={handleVerifyAuditTrail}
            disabled={verifying}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {verifying ? "Verifying Chain..." : "Verify Chain"}
          </button>
        </div>

        {verificationResult && (
          <div
            className={`p-4 rounded-lg border text-sm ${
              verificationResult.is_intact
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {verificationResult.is_intact ? (
              <div className="flex items-center gap-2">
                <span>✅</span>
                <p className="font-semibold">
                  Audit Trail Verified: Cryptographic hash chain is fully intact
                  and tamper-evident.
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
                  <span className="font-mono">
                    {verificationResult.first_tampered_record_id}
                  </span>
                </p>
                {verificationResult.details && (
                  <p>Details: {verificationResult.details}</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

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
