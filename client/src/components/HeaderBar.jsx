import React from "react";

export default function HeaderBar() {
  return (
    <header className="bg-surface dark:bg-surface-container-low border-b border-outline-variant shadow-sm w-full z-50 flex justify-between items-center px-lg h-16 max-w-container-max mx-auto shrink-0">
      <div className="flex items-center gap-xl h-full">
        <h1 className="text-headline-md font-headline-md font-bold text-primary">
          DG Cluster Assortment Advisor
        </h1>
        <nav className="hidden md:flex h-full gap-md">
          <a
            className="flex flex-col justify-center h-full text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high px-md"
            href="#"
          >
            <span className="font-label-md text-label-md">Dashboard</span>
          </a>
          <a
            className="flex flex-col justify-center h-full text-primary border-b-2 border-secondary-container font-bold pb-1 opacity-80 duration-150 px-md"
            href="#"
          >
            <span className="font-label-md text-label-md">Assortment</span>
          </a>
          <a
            className="flex flex-col justify-center h-full text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high px-md"
            href="#"
          >
            <span className="font-label-md text-label-md">Scenarios</span>
          </a>
          <a
            className="flex flex-col justify-center h-full text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high px-md"
            href="#"
          >
            <span className="font-label-md text-label-md">Guardrails</span>
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-md">
        <button className="hidden lg:flex items-center gap-2 bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary transition-colors">
          <span>Review Changes</span>
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
          <div className="text-right hidden sm:block">
            <p className="font-label-md text-label-md text-on-surface">
              Category Manager
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant text-xs">
              2026-07-16 17:30 UTC
            </p>
          </div>
          <img
            alt="Category Manager Avatar"
            className="w-8 h-8 rounded-full border border-outline-variant object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGf4rkfwZ6ix6WP7xX-6nb6HIOhox6fW0_8Exvi-H2IocDi67Djd3RUe04t7TvdowHdbZIQNQatCC-CXvXS3CeCePJc9GIHKNdnKlWgslrGhYDjQlh9hXZH-1RsKokgkCwuI0ebTRd7JoZ1q9chOkKluihOkQAvhX3Z00NrumFolJafOYB3JtxKXWowGM7CdWYyotREjw_xbxQ82R9LsODJtzdaMKqh_zZJtl6ABRFb-fxu241XQwsF3bUFaAu2pnhVNetJ6ByKk0"
          />
        </div>
      </div>
    </header>
  );
}
