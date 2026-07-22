import React from "react";
import DashboardPage from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-[#ebe2cf]">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#231f14] border-b border-[#4d4632]">
        <div className="flex items-center gap-4">
          <img
            alt="Dollar General Logo"
            className="h-10 w-10 object-contain rounded"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApCRUiyifB6b1RJwv-ffJ-K2NCoHtI-ph5rwPnceKTQ55yLh4_Kt2JC28ONgSDYOeBrl9-oVnUU3oHXgpOTtiFk5oj16UlgaOMHCy4BBDfZLdzIQLPiUESPbitAUEtVA8oJVXNMVnXPhs-ui9kKqMWO6LwGPOq5PkLPnX7VWewDjeRUT1HnUfbYvRzbNaTAmRURE-01UQur4AxLFy_lKd7QyEwSzszDMfacz6GcVMgN2j_s3MqqlK6WaFzjphvIu2eRUgLOZsAcqs"
          />
          <div className="flex flex-col">
            <span className="font-bold text-[#ffd100] text-lg md:text-xl">
              DG Cluster Assortment Advisor
            </span>
            <span className="text-xs text-[#ffd100] opacity-80">
              Small Town Value Cluster — Snacks Category
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-[#d1c6ab]">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#ebe2cf] transition-colors">
              notifications
            </span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#ebe2cf] transition-colors">
              settings
            </span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-[#2e2a1e] p-2 rounded transition-colors">
            <div className="h-8 w-8 bg-[#2e2a1e] rounded-full flex items-center justify-center border border-[#4d4632]">
              <span className="material-symbols-outlined text-[#ebe2cf]">
                person
              </span>
            </div>
            <div className="flex flex-col hidden md:flex">
              <span className="text-xs font-semibold text-[#ebe2cf]">
                Category Manager
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* SideNavBar & Main Content Wrapper */}
      <div className="flex flex-1 pt-16">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col pt-6 bg-[#171309] border-r border-[#4d4632] w-64 z-40 hidden md:flex">
          <div className="px-6 mb-6">
            <h2 className="text-lg font-bold text-[#ebe2cf]">
              Category Management
            </h2>
            <p className="text-xs text-[#d1c6ab] mt-1">Retail Analytics v2.4</p>
          </div>
          <nav className="flex-1 flex flex-col gap-2 px-3">
            <a
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#d1c6ab] hover:text-[#ebe2cf] hover:bg-[#2e2a1e] transition-all cursor-pointer duration-200"
              href="#"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#393428] text-[#ffd100] border-l-4 border-[#ffd100] hover:bg-[#2e2a1e] transition-all cursor-pointer duration-200"
              href="#"
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="text-sm font-medium">Assortment Plan</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#d1c6ab] hover:text-[#ebe2cf] hover:bg-[#2e2a1e] transition-all cursor-pointer duration-200"
              href="#"
            >
              <span className="material-symbols-outlined">analytics</span>
              <span className="text-sm font-medium">Scenario Builder</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#d1c6ab] hover:text-[#ebe2cf] hover:bg-[#2e2a1e] transition-all cursor-pointer duration-200"
              href="#"
            >
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm font-medium">Audit Log</span>
            </a>
          </nav>
          <div className="flex flex-col gap-2 px-3 pb-6">
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#d1c6ab] hover:text-[#ebe2cf] hover:bg-[#2e2a1e] transition-all"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px]">
                help
              </span>
              <span className="text-xs">Support</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#d1c6ab] hover:text-[#ebe2cf] hover:bg-[#2e2a1e] transition-all"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
              <span className="text-xs">Logout</span>
            </a>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 md:ml-64 p-8 flex flex-col gap-6 overflow-y-auto bg-[#090D16]">
          <DashboardPage />
        </main>
      </div>
    </div>
  );
}
