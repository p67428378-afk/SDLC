import React from "react";

export default function AuditTrailTable({ logs }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-900">System Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-1">
          Immutable log of all customer and administrator activities
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600 tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4">Source IP</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">
                    {log.user_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded font-semibold">
                      {log.event_type}
                    </span>
                  </td>
                  <td
                    className="py-3 px-4 max-w-xs truncate text-slate-600"
                    title={JSON.stringify(log.event_details)}
                  >
                    {typeof log.event_details === "object"
                      ? JSON.stringify(log.event_details)
                      : log.event_details}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {log.source_ip}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
