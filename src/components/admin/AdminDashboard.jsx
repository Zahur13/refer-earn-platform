import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Users,
  Wallet,
  TrendingUp,
  Activity,
  UserCheck,
  Clock,
  Link,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    pendingWithdrawals: 0,
    adminEarnings: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminEarnings, setAdminEarnings] = useState(0);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Fetch all users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const activeUsers = users.filter(
        (u) => u.isReferralActive && u.role !== "admin"
      );
      const pendingUsers = users.filter(
        (u) => !u.isReferralActive && u.role !== "admin"
      );
      const totalBalance = users.reduce(
        (sum, u) => sum + (u.wallet?.balance || 0),
        0
      );

      // Fetch transactions
      const txnSnap = await getDocs(collection(db, "transactions"));
      const transactions = txnSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch withdrawals
      const withdrawalsSnap = await getDocs(
        query(collection(db, "withdrawals"), where("status", "==", "PENDING"))
      );

      // Fetch admin earnings
      const adminEarningsSnap = await getDocs(collection(db, "adminStats"));
      let adminEarnings = 0;
      adminEarningsSnap.forEach((doc) => {
        adminEarnings += doc.data().totalEarnings || 0;
      });

      // Get recent users
      const recentUsersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const recentUsersSnap = await getDocs(recentUsersQuery);
      const recentUsersData = recentUsersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // In fetchAdminStats function
      const currentAdminDoc = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );
      if (!currentAdminDoc.empty) {
        const adminData = currentAdminDoc.docs[0].data();
        setAdminEarnings(adminData.wallet?.balance || 0);
      }

      // Get recent transactions
      const recentTxnQuery = query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const recentTxnSnap = await getDocs(recentTxnQuery);
      const recentTxnData = recentTxnSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStats({
        totalUsers: users.filter((u) => u.role !== "admin").length,
        activeUsers: activeUsers.length,
        pendingUsers: pendingUsers.length,
        totalBalance,
        totalTransactions: transactions.length,
        pendingWithdrawals: withdrawalsSnap.size,
        adminEarnings,
      });

      setRecentUsers(recentUsersData.filter((u) => u.role !== "admin"));
      setRecentTransactions(recentTxnData);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the admin panel</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8" />
          </div>
          <p className="text-blue-100 text-sm">Total Users</p>
          <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="h-8 w-8" />
          </div>
          <p className="text-green-100 text-sm">Active Users</p>
          <p className="text-4xl font-bold mt-2">{stats.activeUsers}</p>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-8 w-8" />
          </div>
          <p className="text-yellow-100 text-sm">Pending Activations</p>
          <p className="text-4xl font-bold mt-2">{stats.pendingUsers}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="h-8 w-8" />
          </div>
          <p className="text-purple-100 text-sm">Total Platform Balance</p>
          <p className="text-4xl font-bold mt-2">
            {formatCurrency(stats.totalBalance)}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8" />
          </div>
          <p className="text-pink-100 text-sm">Total Transactions</p>
          <p className="text-4xl font-bold mt-2">{stats.totalTransactions}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8" />
          </div>
          <p className="text-red-100 text-sm">Pending Withdrawals</p>
          <p className="text-4xl font-bold mt-2">{stats.pendingWithdrawals}</p>
        </div>

        <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="h-8 w-8" />
          </div>
          <p className="text-indigo-100 text-sm">Admin Earnings</p>
          <p className="text-4xl font-bold mt-2">
            {formatCurrency(adminEarnings)}
          </p>
        </div>
      </div>

      {/* Add this card to the stats grid */}
      <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <Wallet className="h-8 w-8" />
        </div>
        <p className="text-yellow-100 text-sm">My Earnings</p>
        <p className="text-4xl font-bold mt-2">
          {formatCurrency(adminEarnings)}
        </p>
        <Link
          to="/admin/earnings"
          className="mt-4 block text-center bg-white text-yellow-600 hover:bg-yellow-50 font-semibold py-2 px-4 rounded-lg transition text-sm"
        >
          Manage Earnings
        </Link>
      </div>
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.isReferralActive
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.isReferralActive ? "Active" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {txn.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(txn.createdAt)}
                  </p>
                </div>
                <p
                  className={`font-bold ${
                    txn.type === "CREDIT" || txn.type === "REFERRAL_BONUS"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(txn.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
