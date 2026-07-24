import React, { useState, useEffect } from "react";
import { authAPI } from "./services/api";
import DashboardPage from "./pages/DashboardPage";
import TransfersPage from "./pages/TransfersPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'

  // Login form state
  const [username, setUsername] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegRegEmail] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await authAPI.me();
      setUser(currentUser);
      if (currentUser.role === "admin") {
        setCurrentPage("admin");
      } else {
        setCurrentPage("dashboard");
      }
    } catch (err) {
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await authAPI.login({ username, password });
      setToken(data.access_token);
      setUser(data.user);
      if (data.user.role === "admin") {
        setCurrentPage("admin");
      } else {
        setCurrentPage("dashboard");
      }
    } catch (err) {
      setAuthError(
        err.response?.data?.detail ||
          "Invalid credentials or account suspended.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      await authAPI.register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
      });
      setAuthMode("login");
      setUsername(regUsername);
      setPassword(regPassword);
      setAuthError("Registration successful! Please log in.");
    } catch (err) {
      setAuthError(
        err.response?.data?.detail ||
          "Registration failed. Username or email may already exist.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      setCurrentPage("dashboard");
    }
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-slate-200">
          <div>
            <h1 className="text-center text-3xl font-extrabold text-indigo-600">
              ApexBank
            </h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              {authMode === "login"
                ? "Sign in to your secure banking portal"
                : "Create your retail banking account"}
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-sm text-center">
              {authError}
            </div>
          )}

          {authMode === "login" ? (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-700">Test Accounts:</p>
                <p>
                  Customer:{" "}
                  <span className="font-mono font-bold">test@example.com</span>{" "}
                  / <span className="font-mono font-bold">testpassword</span>
                </p>
                <p>
                  Admin:{" "}
                  <span className="font-mono font-bold">admin@example.com</span>{" "}
                  / <span className="font-mono font-bold">adminpassword</span>
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {authLoading ? "Signing in..." : "Sign In"}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Don't have an account? Register here
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegRegEmail(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {authLoading ? "Registering..." : "Register"}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Navigation */}
      <nav className="w-[280px] h-screen fixed left-0 top-0 bg-slate-900 z-50 flex flex-col py-6 px-4 text-slate-300">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ApexBank
          </h1>
          <p className="text-xs text-slate-400 mt-1">Premium Banking Portal</p>
        </div>
        <ul className="flex flex-col gap-2 flex-1">
          {!isAdmin ? (
            <>
              <li>
                <button
                  onClick={() => setCurrentPage("dashboard")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    currentPage === "dashboard"
                      ? "text-white font-bold bg-indigo-600"
                      : "hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>📊</span>
                  <span className="text-sm font-medium">Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage("transfers")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    currentPage === "transfers"
                      ? "text-white font-bold bg-indigo-600"
                      : "hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>💸</span>
                  <span className="text-sm font-medium">
                    Transfers & Payments
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    currentPage === "profile"
                      ? "text-white font-bold bg-indigo-600"
                      : "hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>⚙️</span>
                  <span className="text-sm font-medium">
                    Profile & Settings
                  </span>
                </button>
              </li>
            </>
          ) : (
            <li>
              <button
                onClick={() => setCurrentPage("admin")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                  currentPage === "admin"
                    ? "text-white font-bold bg-indigo-600"
                    : "hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>🛡️</span>
                <span className="text-sm font-medium">
                  Admin Control Center
                </span>
              </button>
            </li>
          )}
        </ul>
        <div className="mt-auto px-2 pb-2 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {user.full_name[0]}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                {user.full_name}
              </p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {currentPage}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Secure Session Active
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-5xl w-full mx-auto">
          {currentPage === "dashboard" && <DashboardPage />}
          {currentPage === "transfers" && <TransfersPage />}
          {currentPage === "profile" && <ProfilePage />}
          {currentPage === "admin" && <AdminDashboardPage />}
        </main>
      </div>
    </div>
  );
}
