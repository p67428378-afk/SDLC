import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import KpiHeaderStrip from "../components/assortment/KpiHeaderStrip.jsx";
import SkuPerformanceTable from "../components/assortment/SkuPerformanceTable.jsx";
import ScenarioSelector from "../components/assortment/ScenarioSelector.jsx";
import ApprovalReviewPanel from "../components/assortment/ApprovalReviewPanel.jsx";
import Modal from "../components/common/Modal.jsx";
import {
  getKpis,
  getSkus,
  getScenario,
  submitAssortment,
} from "../services/api.js";

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(null);

  const [skus, setSkus] = useState([]);
  const [skusLoading, setSkusLoading] = useState(true);
  const [skusError, setSkusError] = useState(null);

  const [selectedScenario, setSelectedScenario] = useState("Balanced");
  const [scenarioData, setScenarioData] = useState(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [scenarioError, setScenarioError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch KPIs and SKUs on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setKpisLoading(true);
        const kpiData = await getKpis();
        setKpis(kpiData);
        setKpisError(null);
      } catch (err) {
        console.error("Error fetching KPIs:", err);
        setKpisError(err.message || "Failed to load KPIs");
      } finally {
        setKpisLoading(false);
      }

      try {
        setSkusLoading(true);
        const skuData = await getSkus();
        setSkus(skuData);
        setSkusError(null);
      } catch (err) {
        console.error("Error fetching SKUs:", err);
        setSkusError(err.message || "Failed to load SKUs");
      } finally {
        setSkusLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch scenario details when selected scenario changes
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        setScenarioLoading(true);
        const data = await getScenario(selectedScenario);
        setScenarioData(data);
        setScenarioError(null);
      } catch (err) {
        console.error(`Error fetching scenario ${selectedScenario}:`, err);
        setScenarioError(
          err.message || `Failed to load scenario ${selectedScenario}`,
        );
      } finally {
        setScenarioLoading(false);
      }
    };

    fetchScenarioData();
  }, [selectedScenario]);

  const handleSubmit = async () => {
    if (!scenarioData) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      const result = await submitAssortment(
        selectedScenario,
        scenarioData.sku_actions,
      );
      setSubmissionResult(result);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error submitting assortment:", err);
      setSubmitError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to submit assortment plan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 ml-0 md:ml-[260px] p-container-margin md:p-lg overflow-y-auto">
      {/* KPI Strip */}
      <KpiHeaderStrip kpis={kpis} loading={kpisLoading} error={kpisError} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column (SKU & Scenarios) */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          {/* SKU Performance Table */}
          <SkuPerformanceTable
            skus={skus}
            loading={skusLoading}
            error={skusError}
          />

          {/* Scenario Selector */}
          <ScenarioSelector
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario}
          />
        </div>

        {/* Right Column (Approval Sidebar) */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          <ApprovalReviewPanel
            scenarioData={scenarioData}
            loading={scenarioLoading}
            error={scenarioError}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-[#38BDF8]/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-[#38BDF8]" />
          </div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-2">
            Assortment Submitted Successfully!
          </h2>
          <p className="text-sm text-on-surface-variant">
            {submissionResult?.message ||
              "Your assortment plan has been recorded."}
          </p>
        </div>

        {submissionResult && (
          <div className="bg-surface-dim rounded-lg p-md mb-6 border border-surface-variant">
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-3">
              Audit Log
            </h4>
            <ul className="flex flex-col gap-2 font-mono-data text-mono-data text-on-surface text-sm">
              <li className="flex justify-between border-b border-surface-variant pb-1">
                <span className="text-on-surface-variant">ID:</span>
                <span className="truncate max-w-[200px]">
                  {submissionResult.id}
                </span>
              </li>
              <li className="flex justify-between border-b border-surface-variant pb-1">
                <span className="text-on-surface-variant">Transaction ID:</span>
                <span>{submissionResult.transaction_id}</span>
              </li>
              <li className="flex justify-between border-b border-surface-variant pb-1">
                <span className="text-on-surface-variant">User:</span>
                <span>{submissionResult.user_id}</span>
              </li>
              <li className="flex justify-between border-b border-surface-variant pb-1">
                <span className="text-on-surface-variant">Timestamp:</span>
                <span>
                  {new Date(submissionResult.submitted_at).toLocaleString()}
                </span>
              </li>
              <li className="flex justify-between border-b border-surface-variant pb-1">
                <span className="text-on-surface-variant">Scenario:</span>
                <span className="text-primary-container">
                  {submissionResult.scenario_name}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-on-surface-variant">Actions:</span>
                <span>{submissionResult.sku_actions?.length || 0} changes</span>
              </li>
            </ul>
          </div>
        )}

        <button
          onClick={() => setIsModalOpen(false)}
          className="w-full border border-surface-variant text-on-surface font-label-md text-label-md py-3 rounded-md hover:bg-surface-bright transition-colors"
        >
          Close
        </button>
      </Modal>
    </main>
  );
}
