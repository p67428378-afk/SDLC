import React, { useEffect, useState } from "react";
import { bankingAPI } from "../services/api";
import AccountCard from "../components/banking/AccountCard";
import TransactionTable from "../components/banking/TransactionTable";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accountsData = await bankingAPI.getAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0]);
        const txData = await bankingAPI.getTransactions(accountsData[0].id);
        setTransactions(txData.items || []);
      }
    } catch (err) {
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (account) => {
    setSelectedAccount(account);
    try {
      const txData = await bankingAPI.getTransactions(account.id);
      setTransactions(txData.items || []);
    } catch (err) {
      setError("Failed to load transactions for the selected account.");
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
        <section className="space-y-4">
          <TransactionTable
            transactions={transactions}
            onSearchChange={async (search) => {
              try {
                const txData = await bankingAPI.getTransactions(
                  selectedAccount.id,
                  { search },
                );
                setTransactions(txData.items || []);
              } catch (err) {
                console.error(err);
              }
            }}
            onTypeChange={async (type) => {
              try {
                const txData = await bankingAPI.getTransactions(
                  selectedAccount.id,
                  { type },
                );
                setTransactions(txData.items || []);
              } catch (err) {
                console.error(err);
              }
            }}
          />
        </section>
      )}
    </div>
  );
}
