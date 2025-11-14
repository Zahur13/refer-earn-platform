import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "../../utils/helpers";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Note: For charts, you'd need to install chart.js
// npm install chart.js react-chartjs-2

const AdminStats = () => {
  const [stats, setStats] = useState({
    todaySignups: 0,
    todayTransactions: 0,
    todayRevenue: 0,
    weeklyGrowth: 0,
    monthlyRevenue: 0,
    activeUsersToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get today's signups
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const todaySignups = allUsers.filter((u) => {
        const createdAt = u.createdAt?.toDate();
        return createdAt >= today;
      }).length;

      // Get all transactions
      const txnSnap = await getDocs(collection(db, "transactions"));
      const allTransactions = txnSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const todayTransactions = allTransactions.filter((t) => {
        const createdAt = t.createdAt?.toDate();
        return createdAt >= today;
      });

      const todayRevenue = todayTransactions.reduce((sum, t) => {
        if (t.type === "CREDIT") return sum + t.amount;
        return sum;
      }, 0);

      // Monthly revenue
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyTransactions = allTransactions.filter((t) => {
        const createdAt = t.createdAt?.toDate();
        return createdAt >= monthStart;
      });

      const monthlyRevenue = monthlyTransactions.reduce((sum, t) => {
        if (t.type === "CREDIT") return sum + t.amount;
        return sum;
      }, 0);

      // Calculate weekly growth
      const lastWeekUsers = allUsers.filter((u) => {
        const createdAt = u.createdAt?.toDate();
        return createdAt >= weekAgo && createdAt < today;
      }).length;

      const thisWeekUsers = allUsers.filter((u) => {
        const createdAt = u.createdAt?.toDate();
        return createdAt >= today;
      }).length;

      const weeklyGrowth =
        lastWeekUsers > 0
          ? (((thisWeekUsers - lastWeekUsers) / lastWeekUsers) * 100).toFixed(2)
          : 0;

      setStats({
        todaySignups,
        todayTransactions: todayTransactions.length,
        todayRevenue,
        weeklyGrowth,
        monthlyRevenue,
        activeUsersToday: allUsers.filter((u) => u.isReferralActive).length,
      });
    } catch (error) {
      console.error("Error fetching detailed stats:", error);
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
        <h1 className="text-3xl font-bold text-gray-900">
          Advanced Statistics
        </h1>
        <p className="text-gray-600 mt-1">Detailed analytics and insights</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-8 w-8" />
          </div>
          <p className="text-blue-100 text-sm">Today's Signups</p>
          <p className="text-4xl font-bold mt-2">{stats.todaySignups}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8" />
          </div>
          <p className="text-green-100 text-sm">Today's Transactions</p>
          <p className="text-4xl font-bold mt-2">{stats.todayTransactions}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8" />
          </div>
          <p className="text-purple-100 text-sm">Today's Revenue</p>
          <p className="text-4xl font-bold mt-2">
            {formatCurrency(stats.todayRevenue)}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8" />
          </div>
          <p className="text-orange-100 text-sm">Weekly Growth</p>
          <p className="text-4xl font-bold mt-2">{stats.weeklyGrowth}%</p>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Monthly Revenue
          </h3>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
            <p className="text-green-700 text-sm">Total Revenue This Month</p>
            <p className="text-5xl font-bold text-green-900 mt-2">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Active Users</h3>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
            <p className="text-blue-700 text-sm">Currently Active</p>
            <p className="text-5xl font-bold text-blue-900 mt-2">
              {stats.activeUsersToday}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(
                (stats.activeUsersToday / Math.max(stats.todaySignups, 1)) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-sm text-gray-600 mt-1">Activation Rate</p>
          </div>

          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                stats.todayRevenue / Math.max(stats.todayTransactions, 1)
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">Avg Transaction</p>
          </div>

          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.weeklyGrowth}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Growth Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
