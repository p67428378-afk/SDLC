import React, { useState } from "react";

export default function TransferForm({ accounts, onSubmit, loading }) {
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountNumber, setDestinationAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!sourceAccountId) {
      setError("Please select a source account.");
      return;
    }
    if (!destinationAccountNumber) {
      setError("Please enter a destination account number.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
    if (sourceAccount && sourceAccount.balance < parseFloat(amount)) {
      setError("Insufficient funds in the selected source account.");
      return;
    }

    try {
      await onSubmit({
        source_account_id: sourceAccountId,
        destination_account_number: destinationAccountNumber,
        amount: parseFloat(amount),
        description,
      });
      setSuccess(true);
      setAmount("");
      setDescription("");
      setDestinationAccountNumber("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Transfer failed. Please try again.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4"
    >
      <h2 className="text-lg font-bold text-slate-900 mb-2">Transfer Funds</h2>

      {error && (
        <div
          className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm">
          Transfer initiated successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Source Account
        </label>
        <select
          value={sourceAccountId}
          onChange={(e) => setSourceAccountId(e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          <option value="">Select Account</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_type} (•••• {acc.account_number.slice(-4)}) -
              Balance: ${acc.balance.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Destination Account Number
        </label>
        <input
          type="text"
          value={destinationAccountNumber}
          onChange={(e) => setDestinationAccountNumber(e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          placeholder="Enter account number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Amount ($)
        </label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          placeholder="Optional description"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : "Send Transfer"}
      </button>
    </form>
  );
}
