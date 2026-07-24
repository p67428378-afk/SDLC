import React, { useEffect, useState } from "react";
import { authAPI, bankingAPI } from "../services/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState({ email: "", full_name: "" });
  const [preferences, setPreferences] = useState({
    email_alerts: false,
    sms_alerts: false,
    min_alert_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [prefError, setPrefError] = useState("");
  const [prefSuccess, setPrefSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = await authAPI.me();
      setProfile({ email: user.email, full_name: user.full_name });

      // Fetch preferences if available, or use defaults
      try {
        // Since there is no direct GET preferences endpoint in openapi.json, we can use defaults or mock
        // Wait, let's check if there is a GET preferences endpoint. No, openapi.json only has PUT /api/v1/banking/preferences.
        // So we can initialize with defaults.
        setPreferences({
          email_alerts: true,
          sms_alerts: false,
          min_alert_amount: 100,
        });
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      setProfileError("Failed to load profile information.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    try {
      const updated = await bankingAPI.updateProfile(profile);
      setProfile({ email: updated.email, full_name: updated.full_name });
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(
        err.response?.data?.detail || "Failed to update profile.",
      );
    }
  };

  const handlePrefSubmit = async (e) => {
    e.preventDefault();
    setPrefError("");
    setPrefSuccess(false);
    try {
      const updated = await bankingAPI.updatePreferences(preferences);
      setPreferences(updated);
      setPrefSuccess(true);
    } catch (err) {
      setPrefError(
        err.response?.data?.detail || "Failed to update preferences.",
      );
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Profile & Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your personal information and notification preferences
        </p>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleProfileSubmit}
        className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-900">
          Personal Information
        </h2>

        {profileError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-sm">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm">
            Profile updated successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Save Profile
        </button>
      </form>

      {/* Preferences Form */}
      <form
        onSubmit={handlePrefSubmit}
        className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-900">
          Notification Preferences
        </h2>

        {prefError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-sm">
            {prefError}
          </div>
        )}
        {prefSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm">
            Preferences updated successfully!
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <div>
            <label className="block text-sm font-medium text-slate-900">
              Email Alerts
            </label>
            <span className="text-xs text-slate-500">
              Receive transaction alerts via email
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.email_alerts}
            onChange={(e) =>
              setPreferences({ ...preferences, email_alerts: e.target.checked })
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <label className="block text-sm font-medium text-slate-900">
              SMS Alerts
            </label>
            <span className="text-xs text-slate-500">
              Receive transaction alerts via SMS
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.sms_alerts}
            onChange={(e) =>
              setPreferences({ ...preferences, sms_alerts: e.target.checked })
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Minimum Alert Amount ($)
          </label>
          <input
            type="number"
            value={preferences.min_alert_amount}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                min_alert_amount: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
}
