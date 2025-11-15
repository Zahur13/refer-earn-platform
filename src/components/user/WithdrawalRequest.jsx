import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/config";
import { createWithdrawalRequest } from "../../api/vercelFunctions";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import {
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Smartphone,
} from "lucide-react";
import { formatCurrency, formatDate, validateUPI } from "../../utils/helpers";
import { CONSTANTS, WITHDRAWAL_STATUS } from "../../utils/constants";
import toast from "react-hot-toast";

const WithdrawalRequest = () => {
  const { userData, refreshUserData } = useAuth();
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState(""); // Changed from bankDetails
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    fetchWithdrawals();
  }, [userData]);

  const fetchWithdrawals = async () => {
    if (!userData) return;

    try {
      const q = query(
        collection(db, "withdrawals"),
        where("userId", "==", userData.id),
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const withdrawalAmount = Number(amount);

    // Validations
    if (withdrawalAmount < CONSTANTS.MIN_WITHDRAWAL) {
      toast.error(
        `Minimum withdrawal amount is ${formatCurrency(
          CONSTANTS.MIN_WITHDRAWAL
        )}`
      );
      return;
    }

    if (withdrawalAmount > userData.wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (withdrawalAmount > CONSTANTS.MAX_WITHDRAWAL) {
      toast.error(
        `Maximum withdrawal amount is ${formatCurrency(
          CONSTANTS.MAX_WITHDRAWAL
        )}`
      );
      return;
    }

    // Validate UPI ID
    if (!validateUPI(upiId)) {
      toast.error("Please enter a valid UPI ID (e.g., username@paytm)");
      return;
    }

    setLoading(true);

    try {
      // ✅ Call Vercel API
      const result = await createWithdrawalRequest(
        withdrawalAmount,
        upiId.toLowerCase()
      );

      toast.success(result.message);
      setAmount("");
      setUpiId("");
      fetchWithdrawals();
      await refreshUserData();
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error(error.message || "Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case WITHDRAWAL_STATUS.PENDING:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case WITHDRAWAL_STATUS.APPROVED:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case WITHDRAWAL_STATUS.REJECTED:
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case WITHDRAWAL_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case WITHDRAWAL_STATUS.APPROVED:
        return "bg-green-100 text-green-800";
      case WITHDRAWAL_STATUS.REJECTED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="mx-auto space-y-6 max-w-4xl">
      {/* Wallet Balance Card */}
      <div className="text-white bg-gradient-to-r from-green-600 to-green-700 card">
        <div className="flex justify-between items-center">
          <div>
            <p className="mb-1 text-green-100">Available Balance</p>
            <p className="text-4xl font-bold">
              {formatCurrency(userData?.wallet?.balance || 0)}
            </p>
          </div>
          <div className="p-4 rounded-lg backdrop-blur-sm bg-white/20">
            <DollarSign className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="card">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Request Withdrawal via UPI
        </h2>

        {/* Info Box */}
        <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="mb-1 font-semibold">Withdrawal Guidelines:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>
                  Minimum withdrawal: {formatCurrency(CONSTANTS.MIN_WITHDRAWAL)}
                </li>
                <li>
                  Maximum withdrawal: {formatCurrency(CONSTANTS.MAX_WITHDRAWAL)}
                </li>
                <li>Processing time: 2-3 business days</li>
                <li>Amount will be sent to your UPI ID directly</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Withdrawal Amount *
            </label>
            <div className="relative">
              <span className="absolute top-3 left-4 text-gray-500">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 input-field"
                placeholder="Enter amount"
                required
                min={CONSTANTS.MIN_WITHDRAWAL}
                max={Math.min(
                  userData?.wallet?.balance || 0,
                  CONSTANTS.MAX_WITHDRAWAL
                )}
              />
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              UPI ID *
            </label>
            <div className="relative">
              <Smartphone className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                className="pl-10 input-field"
                placeholder="username@paytm"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Example: yourname@paytm, yourname@phonepe, yourname@googlepay
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Withdrawal Request"}
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="card">
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          Withdrawal History
        </h3>

        {withdrawals.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No withdrawal requests yet
          </p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="p-4 rounded-lg border border-gray-200 transition hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        withdrawal.status === WITHDRAWAL_STATUS.PENDING
                          ? "bg-yellow-100"
                          : withdrawal.status === WITHDRAWAL_STATUS.APPROVED
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {getStatusIcon(withdrawal.status)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(withdrawal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      withdrawal.status
                    )}`}
                  >
                    {withdrawal.status}
                  </span>
                </div>

                <div className="p-3 text-sm bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">UPI ID:</span>
                    <span className="font-mono font-semibold">
                      {withdrawal.upiId}
                    </span>
                  </div>
                </div>

                {withdrawal.adminNote && (
                  <div className="p-3 mt-3 bg-blue-50 border-l-4 border-blue-600">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Admin Note: </span>
                      {withdrawal.adminNote}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalRequest;
