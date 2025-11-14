import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Wallet,
  Users,
  Gift,
  TrendingUp,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
} from "lucide-react";
import { formatCurrency, copyToClipboard } from "../../utils/helpers";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import WelcomeBanner from "../shared/WelcomeBanner";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const { userData, refreshUserData } = useAuth();
  const [stats, setStats] = useState({
    referrals: [],
    recentTransactions: [],
    monthlyReferrals: 0,
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserStats();
  }, [userData]);

  const fetchUserStats = async () => {
    if (!userData) return;

    try {
      // Get referrals
      const referralsQuery = query(
        collection(db, "users"),
        where("referrerId", "==", userData.id)
      );
      const referralsSnap = await getDocs(referralsQuery);
      const referralsData = referralsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get monthly referrals
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyReferrals = referralsData.filter((ref) => {
        const createdAt = ref.createdAt?.toDate();
        return createdAt >= currentMonth;
      });

      // Get recent transactions
      const txnQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userData.id),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const txnSnap = await getDocs(txnQuery);
      const transactions = txnSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStats({
        referrals: referralsData,
        recentTransactions: transactions,
        monthlyReferrals: monthlyReferrals.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralCode = async () => {
    const success = await copyToClipboard(userData.referralCode);
    if (success) {
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy");
    }
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${userData.referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Refer & Earn",
          text: `Use my referral code ${userData.referralCode} and start earning!`,
          url: referralLink,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      copyToClipboard(referralLink);
      toast.success("Referral link copied!");
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
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Welcome Section */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {userData?.name}!
            </h1>
            <p className="text-primary-100">Here's your earnings overview</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-xs text-primary-100">Account Status</p>
            <p className="text-sm font-semibold">
              {userData?.isReferralActive
                ? "✅ Active"
                : "⏳ Pending Activation"}
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        {/* ... existing code ... */}
      </div>

      {/* Activation Notice - UPDATE THIS */}
      {!userData?.isReferralActive && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Gift className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">
                Activate Your Referral Account
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                Pay ₹20 via UPI to unlock referral features and start earning!
              </p>
              <button
                onClick={() => navigate("/user/activate")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Activate Now via UPI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Wallet Balance */}
        <div className="card hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            {/* <Link
              to="/user/add-money"
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
            >
              Add Money
            </Link> */}
          </div>
          <p className="text-gray-600 text-sm mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(userData?.wallet?.balance || 0)}
          </p>
        </div>

        {/* Total Referrals */}
        <div className="card hover:shadow-xl transition">
          <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.referrals.length}
          </p>
        </div>

        {/* Monthly Referrals */}
        <div className="card hover:shadow-xl transition">
          <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">This Month</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.monthlyReferrals}
          </p>
        </div>

        {/* Total Earnings */}
        <div className="card hover:shadow-xl transition">
          <div className="bg-orange-100 p-3 rounded-lg w-fit mb-4">
            <Gift className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(userData?.stats?.totalEarnings || 0)}
          </p>
        </div>
      </div>

      {/* Referral Code Section - Only show if user is active */}
      {userData?.isReferralActive && (
        <div className="card bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-xl font-bold mb-4">Your Referral Code</h3>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
            <p className="text-4xl font-bold tracking-wider text-center">
              {userData?.referralCode}
            </p>
          </div>

          {/* Shareable Link */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-100 mb-2">
              Shareable Link
            </label>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <code className="text-xs break-all">
                {`${window.location.origin}/register?ref=${userData?.referralCode}`}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyReferralCode}
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
            <button
              onClick={shareReferralLink}
              className="bg-white text-pink-600 hover:bg-gray-100 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <Share2 className="h-5 w-5" />
              <span>Share Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Show activation notice if not active */}
      {!userData?.isReferralActive && (
        <div className="card bg-gradient-to-r from-gray-600 to-gray-700 text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Lock className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Referral Code Locked</h3>
              <p className="text-gray-200 text-sm mb-3">
                Add ₹20 to your wallet to unlock your referral code and start
                earning!
              </p>
              <Link
                to="/user/add-money"
                className="inline-block bg-white text-gray-900 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition text-sm"
              >
                Activate Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Recent Transactions
          </h3>
          <Link
            to="/user/transactions"
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
          >
            View All
          </Link>
        </div>

        {stats.recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {stats.recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      txn.type === "CREDIT" || txn.type === "REFERRAL_BONUS"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {txn.type === "CREDIT" || txn.type === "REFERRAL_BONUS" ? (
                      <ArrowDownRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {txn.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {txn.createdAt
                        ? new Date(txn.createdAt.toDate()).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-bold ${
                    txn.type === "CREDIT" || txn.type === "REFERRAL_BONUS"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {txn.type === "CREDIT" || txn.type === "REFERRAL_BONUS"
                    ? "+"
                    : "-"}
                  {formatCurrency(txn.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
