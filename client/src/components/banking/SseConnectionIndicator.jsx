import React from "react";

export default function SseConnectionIndicator({ status }) {
  let dotColor = "bg-slate-400";
  let textColor = "text-slate-600";
  let label = "Disconnected";
  let pulseClass = "";

  if (status === "connected") {
    dotColor = "bg-emerald-500";
    textColor = "text-emerald-700";
    label = "Live Connection";
    pulseClass =
      "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75";
  } else if (status === "connecting") {
    dotColor = "bg-amber-500";
    textColor = "text-amber-700";
    label = "Connecting...";
    pulseClass =
      "animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75";
  } else if (status === "disconnected") {
    dotColor = "bg-rose-500";
    textColor = "text-rose-700";
    label = "Offline (Polling)";
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-xs font-semibold">
      <div className="relative flex h-2 w-2">
        {pulseClass && <span className={pulseClass}></span>}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}
        ></span>
      </div>
      <span className={textColor}>{label}</span>
    </div>
  );
}
