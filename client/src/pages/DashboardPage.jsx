import React, { useEffect, useState } from "react";
import {
  getKPIs,
  getSKUsPerformance,
  getScenario,
  submitAssortment,
} from "../services/api";
import KPIHeaderStrip from "../components/assortment/KPIHeaderStrip";
import SKUPerformancePanel from "../components/assortment/SKUPerformancePanel";
import ScenarioSelectorPanel from "../components/assortment/ScenarioSelectorPanel";
import ApprovalReviewPanel from "../components/assortment/ApprovalReviewPanel";
import SuccessModalOverlay from "../components/assortment/SuccessModalOverlay";

export default function DashboardPage() {
  // State for KPIs
  const [kpis, setKPIs] = useState(null);
  const [kpisLoading, setKPIsLoading] = useState(true);
  const [kpisError, setKPIsError] = useState(null);

  // State for SKUs
  const [skus, setSKUs] = useState([]);
  const [totalSKUs, setTotalSKUs] = useState(0);
  const [skuPage, setSKUPage] = useState(1);
  const [skuLimit] = useState(10);
  const [skuSearch, setSKUSearch] = useState("");
  const [skuStatus, setSKUStatus] = useState("");
  const [skusLoading, setSKUsLoading] = useState(true);
  const [skusError, setSKUsError] = useState(null);

  // State for Scenarios
  const [selectedScenario, setSelectedScenario] = useState("Balanced");
  const [scenariosData, setScenariosData] = useState({});
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [scenarioError, setScenarioError] = useState(null);

  // State for Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Fetch KPIs on mount
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setKPIsLoading(true);
        const data = await getKPIs();
        setKPIs(data);
        setKPIsError(null);
      } catch (err) {
        setKPIsError(err);
      } finally {
        setKPIsLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  // Fetch SKUs when page, search, or status changes
  useEffect(() => {
    const fetchSKUs = async () => {
      try {
        setSKUsLoading(true);
        const params = {
          page: skuPage,
          limit: skuLimit,
        };
        if (skuSearch) params.search = skuSearch;
        if (skuStatus) params.status = skuStatus;

        const data = await getSKUsPerformance(params);
        setSKUs(data.items || []);
        setTotalSKUs(data.total || 0);
        setSKUsError(null);
      } catch (err) {
        setSKUsError(err);
      } finally {
        setSKUsLoading(false);
      }
    };
    fetchSKUs();
  }, [skuPage, skuLimit, skuSearch, skuStatus]);

  // Fetch Scenario details when selectedScenario changes
  useEffect(() => {
    const fetchScenarioDetails = async () => {
      const key = selectedScenario.toLowerCase();
      if (scenariosData[key]) {
        setScenarioLoading(false);
        return;
      }

      try {
        setScenarioLoading(true);
        const data = await getScenario(selectedScenario);
        setScenariosData((prev) => ({
          ...prev,
          [key]: data,
        }));
        setScenarioError(null);
      } catch (err) {
        setScenarioError(err);
      } finally {
        setScenarioLoading(false);
      }
    };
    fetchScenarioDetails();
  }, [selectedScenario, scenariosData]);

  const handleScenarioSelect = (name) => {
    setSelectedScenario(name);
  };

  const handlePageChange = (newPage) => {
    setSKUPage(newPage);
  };

  const handleSearchChange = (query) => {
    setSKUSearch(query);
    setSKUPage(1); // Reset to first page
  };

  const handleStatusChange = (status) => {
    setSKUStatus(status);
    setSKUPage(1); // Reset to first page
  };

  const handleSubmitPlan = async () => {
    const key = selectedScenario.toLowerCase();
    const currentScenarioData = scenariosData[key];

    if (!currentScenarioData) {
      setSubmitError("Scenario data is not fully loaded yet.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        scenario_name: selectedScenario,
        user_id: "manager_123",
        sku_actions: currentScenarioData.sku_actions,
        guardrail_status: currentScenarioData.guardrails,
      };

      const result = await submitAssortment(payload);
      setSubmitResult(result);
      setIsSuccessOpen(true);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit assortment plan.";
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const activeScenarioData = scenariosData[selectedScenario.toLowerCase()];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="bg-slate-900 h-[64px] flex justify-between items-center px-margin-desktop w-full z-50 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center font-bold text-slate-900">
            DG
          </div>
          <div>
            <h1 className="font-headline-md text-lg font-bold text-white">
              DG Cluster Assortment Advisor
            </h1>
            <p className="font-body-sm text-xs text-slate-400">
              Small Town Value Cluster Stores
            </p>
          </div>
        </div>
        <div className="flex flex-1 justify-center px-8 hidden md:flex">
          <nav className="flex gap-8">
            <a
              className="font-label-md text-sm text-yellow-400 font-bold border-b-2 border-yellow-400 py-5 transition-colors"
              href="#"
            >
              Overview
            </a>
            <a
              className="font-label-md text-sm text-slate-400 font-medium hover:text-white py-5 transition-colors"
              href="#"
            >
              Category Drilldown
            </a>
            <a
              className="font-label-md text-sm text-slate-400 font-medium hover:text-white py-5 transition-colors"
              href="#"
            >
              SKU Optimizer
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <span className="material-symbols-outlined text-white cursor-pointer hover:opacity-80 transition-opacity">
              notifications
            </span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-label-md text-sm text-white">
                Category Manager
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-700 flex items-center justify-center font-bold text-white">
              CM
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-6">
        {/* KPI Strip */}
        <KPIHeaderStrip kpis={kpis} loading={kpisLoading} error={kpisError} />

        {/* 2/3 - 1/3 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Left Column: SKU Performance */}
          <div className="lg:col-span-2">
            <SKUPerformancePanel
              skus={skus}
              total={totalSKUs}
              page={skuPage}
              limit={skuLimit}
              onPageChange={handlePageChange}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
              loading={skusLoading}
              error={skusError}
            />
          </div>

          {/* Right Column: Scenarios & Review */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <ScenarioSelectorPanel
              selectedScenario={selectedScenario}
              onScenarioSelect={handleScenarioSelect}
              scenariosData={scenariosData}
            />

            <ApprovalReviewPanel
              scenarioName={selectedScenario}
              scenarioData={activeScenarioData}
              onSubmit={handleSubmitPlan}
              submitting={submitting}
              submitError={submitError}
              loading={scenarioLoading}
              error={scenarioError}
            />
          </div>
        </div>
      </main>

      {/* Success Modal Overlay */}
      <SuccessModalOverlay
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        submitResult={submitResult}
      />
    </div>
  );
}
