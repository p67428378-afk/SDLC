import React from "react";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-[#475569] border border-[#64748B] rounded-xl p-lg max-w-md w-full mx-4 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] relative">
        {children}
      </div>
    </div>
  );
}
