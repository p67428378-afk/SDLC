import React from "react";

export default function Badge({ status }) {
  const getStyles = (status) => {
    const upper = (status || "").toUpperCase();
    switch (upper) {
      case "GROW":
        return "bg-[#38BDF8]/15 text-[#38BDF8]";
      case "MAINTAIN":
        return "bg-secondary/15 text-secondary";
      case "SWAP":
        return "bg-primary-container/15 text-primary-container";
      case "REDUCE":
        return "bg-[#F43F5E]/15 text-[#F43F5E]";
      default:
        return "bg-surface-variant text-on-surface-variant";
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStyles(status)}`}
    >
      {status}
    </span>
  );
}
