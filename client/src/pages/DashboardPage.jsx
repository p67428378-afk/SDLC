import React, { useEffect, useState } from "react";
import { bankingAPI } from "../services/api";
import AccountCard from "../components/banking/AccountCard";
import TransactionTable from "../components/banking/TransactionTable";
import SseConnectionIndicator from "../components/banking/SseConnectionIndicator";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sseStatus, setSseStatus] = useState("connecting");

  // Keep track of current filters to apply to live updates or exports
  const [currentFilters, setCurrentFilters] = useState({
    search: null,
    type: null,
    start_date: null,
    end_date: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  // SSE Connection
  useEffect(() => {
    let active = true;
    let controller = new AbortController();

    const connectSSE = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSseStatus("disconnected");
        return;
      }

      try {
        setSseStatus("connecting");
        const response = await fetch(`${BASE_URL}/api/v1/banking/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("SSE connection failed");
        }

        setSseStatus("connected");
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (active) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(trimmed.slice(6));
                handleSseEvent(eventData);
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (err) {
        if (active) {
          console.error("SSE error:", err);
          setSseStatus("disconnected");
          // Retry connection after 5 seconds
          setTimeout(() => {
            if (active) connectSSE();
          }, 5000);
        }
      }
    };

    connectSSE();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const handleSseEvent = (eventData) => {
    const { event, data } = eventData;
    if (event === "balance_update") {
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) =>
          acc.id === data.account_id
            ? {
                ...acc,
                balance: data.balance,
                status: data.status || acc.status,
              }
            : acc,
        ),
      );
      setSelectedAccount((prevSelected) => {
        if (prevSelected && prevSelected.id === data.account_id) {
          return {
            ...prevSelected,
            balance: data.balance,
            status: data.status || prevSelected.status,
          };
        }
        return prevSelected;
      });
    } else if (event === "new_transaction") {
      setSelectedAccount((currentSelected) => {
        if (
          currentSelected &&
          (data.source_account_id === currentSelected.id ||
            data.destination_account_id === currentSelected.id)
        ) {
          setTransactions((prevTx) => {
            // Avoid duplicates
            if (prevTx.some((t) => t.id === data.id)) return prevTx;
            return [data, ...prevTx];
          });
        }
        return currentSelected;
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const accountsData = await bankingAPI.getAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0) {
        const defaultAccount = accountsData[0];
        setSelectedAccount(defaultAccount);
        await Promise.all([
          fetchTransactions(defaultAccount.id, currentFilters),
          fetchStatements(defaultAccount.id),
        ]);
      }
    } catch (err) {
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId, filters = {}) => {
    try {
      const txData = await bankingAPI.getTransactions(accountId, filters);
      setTransactions(txData.items || []);
    } catch (err) {
      setError("Failed to load transactions for the selected account.");
    }
  };

  const fetchStatements = async (accountId) => {
    try {
      const stmtData = await bankingAPI.getStatements(accountId);
      setStatements(stmtData || []);
    } catch (err) {
      console.error("Failed to load statements:", err);
    }
  };

  const handleAccountSelect = async (account) => {
    setSelectedAccount(account);
    await Promise.all([
      fetchTransactions(account.id, currentFilters),
      fetchStatements(account.id),
    ]);
  };

  const handleFilterChange = async (newFilters) => {
    const updatedFilters = { ...currentFilters, ...newFilters };
    setCurrentFilters(updatedFilters);
    if (selectedAccount) {
      await fetchTransactions(selectedAccount.id, updatedFilters);
    }
  };

  const handleExport = async (filters) => {
    if (!selectedAccount) return;
    try {
      const csvBlob = await bankingAPI.exportTransactions(
        selectedAccount.id,
        filters,
      );
      const url = window.URL.createObjectURL(new Blob([csvBlob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `transactions-${selectedAccount.account_number}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export transactions. Please try again.");
    }
  };

  const handleDownloadStatement = async (filename) => {
    try {
      const pdfBlob = await bankingAPI.downloadStatement(filename);
      const url = window.URL.createObjectURL(
        new Blob([pdfBlob], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download statement. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500">
            Here is your near real-time account overview
          </p>
        </div>
        <SseConnectionIndicator status={sseStatus} />
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc) => (
          <AccountCard
            key={acc.id}
            account={acc}
            onSelect={handleAccountSelect}
            isSelected={selectedAccount?.id === acc.id}
          />
        ))}
      </section>

      {selectedAccount && (
        <>
          <section className="space-y-4">
            <TransactionTable
              transactions={transactions}
              onSearchChange={(search) => handleFilterChange({ search })}
              onTypeChange={(type) => handleFilterChange({ type })}
              onDateRangeChange={(start_date, end_date) =>
                handleFilterChange({ start_date, end_date })
              }
              onExport={handleExport}
            />
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Account Statements
            </h2>
            {statements.length === 0 ? (
              <p className="text-sm text-slate-400">
                No statements available for this account.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {statements.map((stmt) => (
                  <div
                    key={stmt.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {stmt.statement_date}
                      </p>
                      <p className="text-xs text-slate-500">{stmt.file_name}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadStatement(stmt.file_name)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1"
                    >
                      <span>📄</span> Download PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
