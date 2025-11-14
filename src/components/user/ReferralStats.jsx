import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";

const ReferralStats = () => {
  const { userData } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, [userData]);

  const fetchReferrals = async () => {
    if (!userData) return;

    try {
      const q = query(
        collection(db, "users"),
        where("referrerId", "==", userData.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReferrals(data);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeReferrals = referrals.filter((r) => r.isReferralActive);
  const pendingReferrals = referrals.filter((r) => !r.isReferralActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <Users className="h-8 w-8" />
          </div>
          <p className="text-blue-100 text-sm mb-1">Total Referrals</p>
          <p className="text-4xl font-bold">{referrals.length}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="h-8 w-8" />
          </div>
          <p className="text-green-100 text-sm mb-1">Active Referrals</p>
          <p className="text-4xl font-bold">{activeReferrals.length}</p>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="h-8 w-8" />
          </div>
          <p className="text-yellow-100 text-sm mb-1">Pending Activation</p>
          <p className="text-4xl font-bold">{pendingReferrals.length}</p>
        </div>
      </div>

      {/* Referrals List */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Your Referrals
        </h2>

        {referrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No referrals yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Share your referral code to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Joined Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Earnings
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{referral.name}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {referral.email}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {referral.isReferralActive ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-green-600">
                      {referral.isReferralActive
                        ? formatCurrency(10)
                        : formatCurrency(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralStats;
