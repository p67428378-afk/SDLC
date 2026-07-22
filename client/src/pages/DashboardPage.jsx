import React, { useState, useEffect } from "react";
import KpiHeaderStrip from "../components/KpiHeaderStrip.jsx";
import SkuPerformanceTable from "../components/SkuPerformanceTable.jsx";
import ScenarioSelector from "../components/ScenarioSelector.jsx";
import ApprovalReviewPanel from "../components/ApprovalReviewPanel.jsx";
import SuccessBanner from "../components/SuccessBanner.jsx";
import {
  getKpis,
  getSkus,
  getScenario,
  submitAssortment,
} from "../services/api.js";

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [skus, setSkus] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState("balanced");
  const [scenarioData, setScenarioData] = useState(null);
  const [auditTrail, setAuditTrail] = useState(null);

  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const kpiData = await getKpis();
        setKpis(kpiData);
      } catch (err) {
        console.error("Error fetching KPIs:", err);
      } finally {
        setLoadingKpis(false);
      }

      try {
        const skuData = await getSkus();
        setSkus(skuData);
      } catch (err) {
        console.error("Error fetching SKUs:", err);
      } finally {
        setLoadingSkus(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchScenarioData = async () => {
      setLoadingScenario(true);
      try {
        const data = await getScenario(selectedScenario);
        setScenarioData(data);
      } catch (err) {
        console.error(`Error fetching scenario ${selectedScenario}:`, err);
      } finally {
        setLoadingScenario(false);
      }
    };

    fetchScenarioData();
  }, [selectedScenario]);

  const handleSelectScenario = (scenarioId) => {
    setSelectedScenario(scenarioId);
  };

  const handleSubmit = async () => {
    if (!scenarioData) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAssortment(
        selectedScenario,
        scenarioData.sku_actions,
      );
      if (result.success) {
        setAuditTrail(result);
        // Scroll to top to show success banner
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError("Submission was not successful.");
      }
    } catch (err) {
      console.error("Error submitting assortment changes:", err);
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        "An unexpected error occurred.";
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissSuccess = () => {
    setAuditTrail(null);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Success Banner */}
      <SuccessBanner auditTrail={auditTrail} onClose={handleDismissSuccess} />

      {/* KPI Row */}
      {loadingKpis ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card-base h-28 bg-[#111827] border border-[#1F2937] rounded-lg"
            ></div>
          ))}
        </div>
      ) : (
        <KpiHeaderStrip kpis={kpis} />
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8-col) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loadingSkus ? (
            <div className="card-base h-96 bg-[#111827] border border-[#1F2937] rounded-lg animate-pulse"></div>
          ) : (
            <SkuPerformanceTable skus={skus} />
          )}
        </div>

        {/* Right Column (4-col) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ScenarioSelector
            selectedScenario={selectedScenario}
            onSelectScenario={handleSelectScenario}
            scenarioData={scenarioData}
            loading={loadingScenario}
          />

          {loadingScenario ? (
            <div className="card-base h-80 bg-[#111827] border border-[#1F2937] rounded-lg animate-pulse"></div>
          ) : (
            <ApprovalReviewPanel
              selectedScenario={selectedScenario}
              scenarioData={scenarioData}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={submitError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
