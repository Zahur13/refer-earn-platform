import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowDownRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { WITHDRAWAL_STATUS } from "../../utils/constants";
import toast from "react-hot-toast";

const AdminEarnings = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    totalWithdrawn: 0,
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminEarnings();
    fetchAdminWithdrawals();
  }, [userData]);

  const fetchAdminEarnings = async () => {
    if (!userData) return;

    try {
      // Get admin's wallet balance
      const availableBalance = userData.wallet?.balance || 0;
      const totalEarnings = userData.stats?.totalEarnings || 0;

      // Get total withdrawn
      const withdrawalsSnap = await getDocs(
        query(
          collection(db, "adminWithdrawals"),
          where("adminId", "==", userData.id),
          where("status", "==", WITHDRAWAL_STATUS.APPROVED)
        )
      );

      const totalWithdrawn = withdrawalsSnap.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      setStats({
        totalEarnings,
        availableBalance,
        totalWithdrawn,
      });
    } catch (error) {
      console.error("Error fetching admin earnings:", error);
    }
  };

  const fetchAdminWithdrawals = async () => {
    if (!userData) return;

    try {
      const q = query(
        collection(db, "adminWithdrawals"),
        where("adminId", "==", userData.id),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWithdrawals(data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const amount = Number(withdrawAmount);

    if (amount < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }

    if (amount > stats.availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode ||
      !bankDetails.accountHolderName
    ) {
      toast.error("Please fill all bank details");
      return;
    }

    setLoading(true);

    try {
      // Create withdrawal request
      await addDoc(collection(db, "adminWithdrawals"), {
        adminId: userData.id,
        adminName: userData.name,
        adminEmail: userData.email,
        amount: amount,
        bankDetails: bankDetails,
        status: WITHDRAWAL_STATUS.APPROVED, // Auto-approve for admin
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Deduct from admin wallet
      await updateDoc(doc(db, "users", userData.id), {
        "wallet.balance": increment(-amount),
        "wallet.lastUpdated": serverTimestamp(),
      });

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        userId: userData.id,
        amount: amount,
        type: "WITHDRAWAL",
        status: "SUCCESS",
        description: `Admin withdrawal to bank account ****${bankDetails.accountNumber.slice(
          -4
        )}`,
        createdAt: serverTimestamp(),
      });

      toast.success("Withdrawal processed successfully!");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setBankDetails({
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: "",
      });

      fetchAdminEarnings();
      fetchAdminWithdrawals();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Earnings</h1>
        <p className="text-gray-600 mt-1">Manage your platform earnings</p>
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="h-8 w-8" />
          </div>
          <p className="text-green-100 text-sm">Available Balance</p>
          <p className="text-4xl font-bold mt-2">
            {formatCurrency(stats.availableBalance)}
          </p>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="mt-4 w-full bg-white text-green-600 hover:bg-green-50 font-semibold py-2 px-4 rounded-lg transition"
            disabled={stats.availableBalance < 100}
          >
            Withdraw Funds
          </button>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8" />
          </div>
          <p className="text-blue-100 text-sm">Total Earnings</p>
          <p className="text-4xl font-bold mt-2">
            {formatCurrency(stats.totalEarnings)}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <ArrowDownRight className="h-8 w-8" />
          </div>
          <p className="text-purple-100 text-sm">Total Withdrawn</p>
          <p className="text-4xl font-bold mt-2">
            {formatCurrency(stats.totalWithdrawn)}
          </p>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Withdrawal History
        </h3>

        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No withdrawals yet</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(withdrawal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {withdrawal.status}
                  </span>
                </div>

                <div className="bg-gray-50 rounded p-3 text-sm mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600">Account:</span>
                      <span className="ml-2 font-semibold">
                        ****{withdrawal.bankDetails?.accountNumber?.slice(-4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">IFSC:</span>
                      <span className="ml-2 font-semibold">
                        {withdrawal.bankDetails?.ifscCode}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Withdraw Earnings
              </h3>

              <form onSubmit={handleWithdraw} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter amount"
                      required
                      min="100"
                      max={stats.availableBalance}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(stats.availableBalance)}
                  </p>
                </div>

                {/* Bank Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      value={bankDetails.accountHolderName}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          accountHolderName: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="As per bank account"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          bankName: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="e.g., State Bank of India"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          accountNumber: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="Enter account number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      value={bankDetails.ifscCode}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          ifscCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="input-field uppercase"
                      placeholder="e.g., SBIN0001234"
                      required
                      maxLength="11"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Withdraw"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEarnings;
