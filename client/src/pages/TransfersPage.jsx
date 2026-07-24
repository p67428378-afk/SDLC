import React, { useEffect, useState } from "react";
import { bankingAPI } from "../services/api";
import TransferForm from "../components/banking/TransferForm";

export default function TransfersPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await bankingAPI.getAccounts();
      setAccounts(data);
    } catch (err) {
      setError("Failed to load accounts for transfer.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (transferData) => {
    await bankingAPI.transferFunds(transferData);
    // Refresh accounts to update balances
    await fetchAccounts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Transfers & Payments
        </h1>
        <p className="text-sm text-slate-500">
          Move funds securely between accounts or to external payees
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <TransferForm accounts={accounts} onSubmit={handleTransferSubmit} />
    </div>
  );
}
