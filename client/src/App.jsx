import React from "react";
import Header from "./components/layout/Header.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import {
  LayoutDashboard,
  BarChart2,
  Layers,
  TrendingUp,
  CheckSquare,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface">
      {/* TopNavBar */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* SideNavBar */}
        <nav className="w-[260px] h-screen fixed left-0 top-[64px] bg-surface-container-low flex flex-col py-md hidden md:flex z-40 border-r border-surface-variant">
          <div className="px-md mb-lg">
            <div className="flex items-center gap-md mb-4">
              <img
                alt="DG Admin"
                className="h-10 w-10 rounded-full bg-surface-bright object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmL-420htTufB3fiV7ov8q5Ll_PAMzRlDqwkBv1fPrkpFxs_LEqFuRpF4nOwKWKdI1X0v7dhuq5HzeUuX99KL2g9CLoCncDUK79CSVQUyajsgknYVxNXbCgb4rCcHwe4Z1W2bRkBVqtCoXwk4_1OauDi82g9SOxdxwnozmyqcWi7vrQJmNa-mbK0l6esTqn-Z1vJgayeUh5YAIuAURa9rzH_Oyktk5T3KkwEcGJ5XPsvTbLgapYBHMpg2WDGPE76RAdweWlOR-wms"
              />
              <div>
                <h2 className="font-headline-md text-headline-md text-primary truncate">
                  Category Planning
                </h2>
                <p className="font-label-md text-label-md text-on-surface-variant truncate">
                  FY24 Q3 Assortment
                </p>
              </div>
            </div>
            <button className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-2 rounded-md hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> New Scenario
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ul className="flex flex-col gap-1 px-sm">
              <li>
                <a
                  className="flex items-center gap-md px-md py-3 rounded-md border-l-4 border-primary-container bg-surface-container-highest text-primary-container"
                  href="#"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-label-md text-label-md">Dashboard</span>
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-md px-md py-3 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 ease-in-out border-l-4 border-transparent"
                  href="#"
                >
                  <BarChart2 className="h-5 w-5" />
                  <span className="font-label-md text-label-md">Analytics</span>
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-md px-md py-3 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 ease-in-out border-l-4 border-transparent"
                  href="#"
                >
                  <Layers className="h-5 w-5" />
                  <span className="font-label-md text-label-md">Scenarios</span>
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-md px-md py-3 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 ease-in-out border-l-4 border-transparent"
                  href="#"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-label-md text-label-md">
                    Performance
                  </span>
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-md px-md py-3 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 ease-in-out border-l-4 border-transparent"
                  href="#"
                >
                  <CheckSquare className="h-5 w-5" />
                  <span className="font-label-md text-label-md">Approvals</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="px-sm mt-auto">
            <ul className="flex flex-col gap-1">
              <li>
                <a
                  className="flex items-center gap-md px-md py-3 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 ease-in-out border-l-4 border-transparent"
                  href="#"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-label-md text-label-md">Settings</span>
                </a>
              </li>
              <li>
                <a
                  className="flex items-center gap-md px-md py-3 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 ease-in-out border-l-4 border-transparent"
                  href="#"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="font-label-md text-label-md">Support</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content Canvas */}
        <DashboardPage />
      </div>
    </div>
  );
}
