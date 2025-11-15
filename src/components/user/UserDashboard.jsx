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
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Welcome Section */}
      <div className="text-white bg-gradient-to-r card from-primary-600 to-primary-700">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              Welcome, {userData?.name}!
            </h1>
            <p className="text-primary-100">Here's your earnings overview</p>
          </div>
          <div className="px-4 py-2 rounded-lg backdrop-blur-sm bg-white/20">
            <p className="text-xs text-primary-100">Account Status</p>
            <p className="text-sm font-semibold">
              {userData?.isReferralActive
                ? "✅ Active"
                : "⏳ Pending Activation"}
            </p>
          </div>
        </div>
      </div>

      {!userData?.isReferralActive && (
        <div className="bg-yellow-50 border-yellow-200 card">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Gift className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-yellow-900">
                Activate Your Referral Account
              </h3>
              <p className="mb-3 text-sm text-yellow-700">
                Pay ₹20 via UPI to unlock referral features and start earning!
              </p>
              <button
                onClick={() => navigate("/user/activate")}
                className="px-4 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-lg transition hover:bg-yellow-700"
              >
                Activate Now via UPI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Wallet Balance */}
        <div className="transition card hover:shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            {/* <Link
              to="/user/add-money"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Add Money
            </Link> */}
          </div>
          <p className="mb-1 text-sm text-gray-600">Wallet Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(userData?.wallet?.balance || 0)}
          </p>
        </div>

        {/* Total Referrals */}
        <div className="transition card hover:shadow-xl">
          <div className="p-3 mb-4 bg-blue-100 rounded-lg w-fit">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="mb-1 text-sm text-gray-600">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.referrals.length}
          </p>
        </div>

        {/* Monthly Referrals */}
        <div className="transition card hover:shadow-xl">
          <div className="p-3 mb-4 bg-purple-100 rounded-lg w-fit">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="mb-1 text-sm text-gray-600">This Month</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.monthlyReferrals}
          </p>
        </div>

        {/* Total Earnings */}
        <div className="transition card hover:shadow-xl">
          <div className="p-3 mb-4 bg-orange-100 rounded-lg w-fit">
            <Gift className="w-6 h-6 text-orange-600" />
          </div>
          <p className="mb-1 text-sm text-gray-600">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(userData?.stats?.totalEarnings || 0)}
          </p>
        </div>
      </div>

      {/* Referral Code Section - Only show if user is active */}
      {userData?.isReferralActive && (
        <div className="text-white bg-gradient-to-r from-purple-600 to-pink-600 card">
          <h3 className="mb-4 text-xl font-bold">Your Referral Code</h3>
          <div className="p-4 mb-4 rounded-lg backdrop-blur-sm bg-white/20">
            <p className="text-4xl font-bold tracking-wider text-center">
              {userData?.referralCode}
            </p>
          </div>

          {/* Shareable Link */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-purple-100">
              Shareable Link
            </label>
            <div className="p-3 rounded-lg backdrop-blur-sm bg-white/20">
              <code className="text-xs break-all">
                {`${window.location.origin}/register?ref=${userData?.referralCode}`}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyReferralCode}
              className="flex justify-center items-center px-4 py-3 space-x-2 font-semibold text-purple-600 bg-white rounded-lg transition hover:bg-gray-100"
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
            <button
              onClick={shareReferralLink}
              className="flex justify-center items-center px-4 py-3 space-x-2 font-semibold text-pink-600 bg-white rounded-lg transition hover:bg-gray-100"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Show activation notice if not active */}
      {!userData?.isReferralActive && (
        <div className="text-white bg-gradient-to-r from-gray-600 to-gray-700 card">
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-full bg-white/20">
              <Lock className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-bold">Referral Code Locked</h3>
              <p className="mb-3 text-sm text-gray-200">
                Add ₹20 to your wallet to unlock your referral code and start
                earning!
              </p>
              <Link
                to="/user/add-money"
                className="inline-block px-4 py-2 text-sm font-semibold text-gray-900 bg-white rounded-lg transition hover:bg-gray-100"
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
            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View All
          </Link>
        </div>

        {stats.recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {stats.recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg transition hover:bg-gray-100"
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
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
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
