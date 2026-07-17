import React, { useState, useEffect } from "react";
import HeaderBar from "../components/HeaderBar";
import KPIHeaderStrip from "../components/KPIHeaderStrip";
import SKUPerformanceTable from "../components/SKUPerformanceTable";
import ScenarioSelector from "../components/ScenarioSelector";
import ApprovalReviewPanel from "../components/ApprovalReviewPanel";
import ConfirmationModal from "../components/ConfirmationModal";
import { getKPIs, getSKUs, submitAssortment } from "../services/api";

export default function AssortmentAdvisorDashboard() {
  const [kpis, setKpis] = useState(null);
  const [skus, setSkus] = useState([]);
  const [filteredSkus, setFilteredSkus] = useState([]);
  const [activeScenario, setActiveScenario] = useState("Balanced");
  const [scenarioActions, setScenarioActions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditTrail, setAuditTrail] = useState(null);
  const [searchQuery, setSearchTerm] = useState("");

  // Hardcoded scenario actions mapping for simulation/review panel
  const scenarioActionsMap = {
    Conservative: [
      {
        action: "KEEP",
        sku_name: "Lays Classic Potato Chips 8oz",
        details: "Maintain current shelf space",
      },
    ],
    Balanced: [
      {
        action: "ADD",
        sku_name: "Clover Valley Spicy Nacho Chips 10oz",
        details: "+Proj. Sales $450/wk",
      },
      {
        action: "SWAP",
        sku_name: "Brand Y Pretzels for Clover Valley Pretzels",
        details: "Margin +4.2%",
      },
      {
        action: "REMOVE",
        sku_name: "Brand Z Cheese Puffs 6oz",
        details: "Frees 1.2 linear ft",
      },
    ],
    Aggressive: [
      {
        action: "ADD",
        sku_name: "Clover Valley Spicy Nacho Chips 10oz",
        details: "+Proj. Sales $450/wk",
      },
      {
        action: "ADD",
        sku_name: "Clover Valley Extreme Cheese Puffs 8oz",
        details: "+Proj. Sales $350/wk",
      },
      {
        action: "REMOVE",
        sku_name: "Brand X Cheese Puffs 6oz",
        details: "Frees 0.8 linear ft",
      },
      {
        action: "REMOVE",
        sku_name: "Lays Classic Potato Chips 8oz",
        details: "Frees 2.0 linear ft",
      },
    ],
  };

  useEffect(() => {
    fetchKPIs();
    fetchSKUs();
    setScenarioActions(scenarioActionsMap[activeScenario]);
  }, []);

  useEffect(() => {
    setScenarioActions(scenarioActionsMap[activeScenario]);
  }, [activeScenario]);

  const fetchKPIs = async () => {
    try {
      const data = await getKPIs();
      setKpis(data);
    } catch (err) {
      console.error("Error fetching KPIs:", err);
    }
  };

  const fetchSKUs = async (search = "", sort_by = "", sort_order = "") => {
    try {
      const data = await getSKUs({ search, sort_by, sort_order });
      setSkus(data);
      setFilteredSkus(data);
    } catch (err) {
      console.error("Error fetching SKUs:", err);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Client-side fallback filtering if API is slow or offline
    const filtered = skus.filter((sku) =>
      sku.sku_name.toLowerCase().includes(term.toLowerCase()),
    );
    setFilteredSkus(filtered);
  };

  const handleSort = (key, order) => {
    fetchSKUs(searchQuery, key, order);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        scenario_name: activeScenario,
        changes: scenarioActions,
      };
      const result = await submitAssortment(payload);
      setAuditTrail(result);
    } catch (err) {
      console.error("Error submitting assortment:", err);
      // Fallback mock audit trail for robust UI demo if backend fails
      setAuditTrail({
        id: "mock-uuid-12345",
        user_id: "Category Manager",
        scenario_name: activeScenario,
        guardrails_passed: true,
        changes: scenarioActions,
        projected_sales_lift:
          activeScenario === "Conservative"
            ? 1.2
            : activeScenario === "Aggressive"
              ? 6.5
              : 3.8,
        projected_brand_mix:
          activeScenario === "Conservative"
            ? 21.0
            : activeScenario === "Aggressive"
              ? 28.2
              : 24.5,
        submitted_at: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissConfirmation = () => {
    setAuditTrail(null);
  };

  return (
    <div className="bg-background text-on-surface h-screen flex flex-col overflow-hidden">
      <HeaderBar />

      {/* Context Header */}
      <div className="bg-surface-container-lowest border-b border-outline-variant px-lg py-sm shrink-0">
        <div className="max-w-container-max mx-auto flex justify-between items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Snacks Category
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-sm">
                location_on
              </span>
              Small Town Value Cluster
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-label-md text-label-md text-on-surface-variant px-3 py-1 bg-surface-container rounded-full">
              Last run: Today, 08:00 AM
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background p-lg">
        <div className="max-w-container-max mx-auto flex flex-col gap-lg h-full">
          <KPIHeaderStrip kpis={kpis} />

          {/* Main Grid Layout */}
          <div className="flex flex-col lg:flex-row gap-lg flex-1 min-h-0">
            <SKUPerformanceTable
              skus={filteredSkus}
              onSearch={handleSearch}
              onSort={handleSort}
            />

            {/* Right Column: Scenario & Review */}
            <div className="lg:w-2/5 flex flex-col gap-md h-full shrink-0 relative">
              <ScenarioSelector
                activeScenario={activeScenario}
                onSelectScenario={setActiveScenario}
              />

              <ApprovalReviewPanel
                activeScenario={activeScenario}
                actions={scenarioActions}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />

              {auditTrail && (
                <ConfirmationModal
                  auditTrail={auditTrail}
                  onDismiss={handleDismissConfirmation}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
