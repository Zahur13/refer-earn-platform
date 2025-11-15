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
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 max-w-6xl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="text-white bg-gradient-to-br from-blue-500 to-blue-600 card">
          <div className="flex justify-between items-center mb-3">
            <Users className="w-8 h-8" />
          </div>
          <p className="mb-1 text-sm text-blue-100">Total Referrals</p>
          <p className="text-4xl font-bold">{referrals.length}</p>
        </div>

        <div className="text-white bg-gradient-to-br from-green-500 to-green-600 card">
          <div className="flex justify-between items-center mb-3">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="mb-1 text-sm text-green-100">Active Referrals</p>
          <p className="text-4xl font-bold">{activeReferrals.length}</p>
        </div>

        <div className="text-white bg-gradient-to-br from-yellow-500 to-yellow-600 card">
          <div className="flex justify-between items-center mb-3">
            <Clock className="w-8 h-8" />
          </div>
          <p className="mb-1 text-sm text-yellow-100">Pending Activation</p>
          <p className="text-4xl font-bold">{pendingReferrals.length}</p>
        </div>
      </div>

      {/* Referrals List */}
      <div className="card">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Your Referrals
        </h2>

        {referrals.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <p className="text-lg text-gray-500">No referrals yet</p>
            <p className="mt-2 text-sm text-gray-400">
              Share your referral code to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">
                    Joined Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-left text-gray-700">
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
                    <td className="px-4 py-3">{referral.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {referral.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {referral.isReferralActive ? (
                        <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">
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
