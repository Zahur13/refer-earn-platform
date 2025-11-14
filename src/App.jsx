import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { db, auth } from "./firebase/config";
import {
  getDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  increment,
  serverTimestamp,
} from "firebase/firestore";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Layout Components
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";

// User Components
import UserDashboard from "./components/user/UserDashboard";
// import AddMoney from "./components/user/AddMoney";
import WithdrawalRequest from "./components/user/WithdrawalRequest";
import ReferralStats from "./components/user/ReferralStats";
import TransactionHistory from "./components/user/TransactionHistory";

// Admin Components
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsers from "./components/admin/AdminUsers";
import AdminWithdrawals from "./components/admin/AdminWithdrawals";
import AdminTransactions from "./components/admin/AdminTransactions";
import AdminStats from "./components/admin/AdminStats";
import AdminEarnings from "./components/admin/AdminEarnings";

// Shared
import LoadingSpinner from "./components/shared/LoadingSpinner";
import ActivateAccount from "./components/user/ActivateAccount";
import NotificationBell from "./components/shared/NotificationBell";
import WelcomeBanner from "./components/shared/WelcomeBanner";
import { requestNotificationPermission } from "./firebase/notificationService";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/user/dashboard" /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/user/dashboard" /> : <Register />}
      />
      {/* User Routes */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UserDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* NEW: Activate Account Route */}
      <Route
        path="/user/activate"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ActivateAccount />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/withdraw"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <WithdrawalRequest />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/referrals"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReferralStats />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/transactions"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TransactionHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <AdminUsers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/withdrawals"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <AdminWithdrawals />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <AdminTransactions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <AdminStats />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* // Add this route in the Admin Routes section */}
      <Route
        path="/admin/earnings"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <AdminEarnings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.db = db;
      window.auth = auth;
      window.getDoc = getDoc;
      window.getDocs = getDocs;
      window.doc = doc;
      window.updateDoc = updateDoc;
      window.setDoc = setDoc;
      window.collection = collection;
      window.query = query;
      window.where = where;
      window.increment = increment;
      window.serverTimestamp = serverTimestamp;
      console.log("🔧 Firebase tools available in console");
    }
  }, []);
  useEffect(() => {
    // Request notification permission on app load
    requestNotificationPermission();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
