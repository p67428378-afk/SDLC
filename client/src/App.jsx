import React from "react";
import DashboardPage from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg h-16 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-md">
          <img
            alt="DG Logo"
            className="h-8 w-8 rounded"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBBMqMWgzGTaDxt6UxYJTXa1lGguNYpTylj6W9qm6yisg6hEXQ4c0-C4TxIzDH9j83LT53WWYNFvGCjjcbZqejD-AIRz2YW8QYxyuxooVygyJPWBB2PoK3SDN9uszvcPz69Kvox-s005at2NyQjlpuWs_f8VhRVy0p7RgpHzbo-csv3oVrSr7CG7wZ_SuO8mHco9rzK6auwEsG1e-EjlaYVY3DFXngsTPMKYzCZRjBLBR0F5Ew4XPrsllCpmi1Y1UYpi_Z9fbpkkA"
          />
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md font-bold text-slate-800 text-lg md:text-xl">
              DG Cluster Assortment Advisor
            </span>
            <span className="font-label-md text-label-md text-slate-500 text-xs">
              Snacks Category — Small Town Value Cluster
            </span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm cursor-pointer hover:bg-slate-50 transition-colors p-sm rounded">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-label-md text-label-md text-slate-800 text-sm font-semibold">
                Category Manager (Snacks)
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <span
                className="material-symbols-outlined text-slate-600"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                person
              </span>
            </div>
          </div>
          <div className="flex gap-sm">
            <button className="p-xs text-slate-600 hover:bg-slate-100 transition-colors rounded-full h-8 w-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">
                notifications
              </span>
            </button>
            <button className="p-xs text-slate-600 hover:bg-slate-100 transition-colors rounded-full h-8 w-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">
                settings
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* SideNavBar & Main Content Wrapper */}
      <div className="flex flex-1 pt-16">
        {/* SideNavBar */}
        <nav className="hidden md:flex flex-col py-md px-sm gap-unit fixed left-0 top-16 h-[calc(100vh-64px)] w-[240px] bg-white border-r border-slate-200 shadow-sm">
          <div className="flex-1 flex flex-col gap-1">
            <a
              className="flex items-center gap-sm p-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
              href="#"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-md text-label-md text-sm font-medium">
                Dashboard
              </span>
            </a>
            <a
              className="flex items-center gap-sm p-sm rounded-lg text-slate-800 bg-slate-100 font-bold transition-all"
              href="#"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                inventory_2
              </span>
              <span className="font-label-md text-label-md text-sm">
                SKU Performance
              </span>
            </a>
            <a
              className="flex items-center gap-sm p-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
              href="#"
            >
              <span className="material-symbols-outlined">analytics</span>
              <span className="font-label-md text-label-md text-sm font-medium">
                Scenario Planner
              </span>
            </a>
            <a
              className="flex items-center gap-sm p-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
              href="#"
            >
              <span className="material-symbols-outlined">layers</span>
              <span className="font-label-md text-label-md text-sm font-medium">
                Cluster View
              </span>
            </a>
            <a
              className="flex items-center gap-sm p-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
              href="#"
            >
              <span className="material-symbols-outlined">fact_check</span>
              <span className="font-label-md text-label-md text-sm font-medium">
                Approvals
              </span>
            </a>
          </div>
          <button className="w-full bg-[#FFD100] hover:bg-[#EDC200] text-[#1E293B] font-bold py-2 rounded-lg mb-md transition-colors shadow-sm">
            Create Scenario
          </button>
          <div className="flex flex-col gap-1 pt-md border-t border-slate-100">
            <a
              className="flex items-center gap-sm p-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
              href="#"
            >
              <span className="material-symbols-outlined">help</span>
              <span className="font-label-md text-label-md text-sm font-medium">
                Help Center
              </span>
            </a>
            <a
              className="flex items-center gap-sm p-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
              href="#"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-label-md text-sm font-medium">
                Logout
              </span>
            </a>
          </div>
        </nav>

        {/* Main Canvas */}
        <main className="flex-1 md:ml-[240px] min-h-[calc(100vh-64px)] flex flex-col bg-slate-50">
          <DashboardPage />
        </main>
      </div>
    </div>
  );
}
