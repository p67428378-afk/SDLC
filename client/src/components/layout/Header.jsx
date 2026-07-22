import React from "react";
import { Search, Bell, Settings, HelpCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="h-[64px] w-full sticky top-0 z-50 border-b border-surface-variant bg-surface-dim flex justify-between items-center px-lg">
      <div className="flex items-center gap-md">
        <img
          alt="Dollar General Logo"
          className="h-8 w-8 object-contain rounded-md"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtIgrQdCaY79HG_sN1sSWJ1SczQDnCuwd-uY4VWq5f5XnZSj7kSgfgEe7HDQtf41Rd7q_frtlMuNlh1Tc_9mAdo8NTA0P9DOkyRHsNk1VsXjWq2wiAbOBOu-VL3c933jNCePcZqioyklOyktrTXIvh9puiWC8tYlG4eBDEyzA9_f9bOyLbj4eWIYWzurotiVERLgx1MUvosRhbVPwKW8yGkisc6VPTtlba7Wp4VSxryvZk1jAD3T5F7JeY3gyRaP3eiiqJRAB7Lg4"
        />
        <div>
          <h1 className="font-headline-sm text-headline-sm text-primary">
            DG Cluster Assortment Advisor
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant">
            Small Town Value Cluster — Snacks Category
          </p>
        </div>
      </div>
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm cursor-pointer hover:bg-surface-bright transition-colors rounded-full p-2">
          <Search className="h-5 w-5 text-on-surface-variant" />
        </div>
        <div className="flex items-center gap-sm cursor-pointer hover:bg-surface-bright transition-colors rounded-full p-2">
          <Bell className="h-5 w-5 text-on-surface-variant" />
        </div>
        <div className="flex items-center gap-sm cursor-pointer hover:bg-surface-bright transition-colors rounded-full p-2">
          <Settings className="h-5 w-5 text-on-surface-variant" />
        </div>
        <div className="flex items-center gap-sm cursor-pointer hover:bg-surface-bright transition-colors rounded-full p-2">
          <HelpCircle className="h-5 w-5 text-on-surface-variant" />
        </div>
        <div className="ml-4 flex items-center gap-sm">
          <img
            alt="Category Manager Profile"
            className="h-8 w-8 rounded-full object-cover border border-surface-variant"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMBS5vUBSMpnltOvxEieEe_HF_Bj-jint1B2w04d3K9vwMZsZAM6j9vqjLtbdm-N12BC-qZUJY9sw7QuR1ezv4P4OZAaa_RN0ht5wgu7Mnm-QSDHjCBJGO6UYsZHBhhvPv7s7_ERio5XKd8a0DlrmUTwSancsTvSYmyxUL0bufdgQO1WZAEl9b732SCkHODwCnI82N6ElFa2QvFIjIE9rXfBmT-pHhjE89hKx-ZT4-fJKqCzBWvesAip0ZVeJDs8JTx00F_DtgSGE"
          />
        </div>
      </div>
    </header>
  );
}
