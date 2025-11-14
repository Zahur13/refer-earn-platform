import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { CONSTANTS, WITHDRAWAL_STATUS } from "../../utils/constants";
import toast from "react-hot-toast";

const WithdrawalRequest = () => {
  const { userData, refreshUserData } = useAuth();
  const [amount, setAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
  });
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
      await addDoc(collection(db, "withdrawals"), {
        userId: userData.id,
        userName: userData.name,
        userEmail: userData.email,
        amount: withdrawalAmount,
        bankDetails: bankDetails,
        status: WITHDRAWAL_STATUS.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Withdrawal request submitted successfully!");
      setAmount("");
      setBankDetails({
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: "",
      });
      fetchWithdrawals();
      await refreshUserData();
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case WITHDRAWAL_STATUS.PENDING:
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case WITHDRAWAL_STATUS.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case WITHDRAWAL_STATUS.REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wallet Balance Card */}
      <div className="card bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 mb-1">Available Balance</p>
            <p className="text-4xl font-bold">
              {formatCurrency(userData?.wallet?.balance || 0)}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <DollarSign className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Request Withdrawal
        </h2>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Withdrawal Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Minimum withdrawal: {formatCurrency(CONSTANTS.MIN_WITHDRAWAL)}
                </li>
                <li>
                  Maximum withdrawal: {formatCurrency(CONSTANTS.MAX_WITHDRAWAL)}
                </li>
                <li>Processing time: 2-3 business days</li>
                <li>Bank details must match your registered name</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field pl-10"
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

          {/* Bank Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={bankDetails.bankName}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, bankName: e.target.value })
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
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Withdrawal History
        </h3>

        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No withdrawal requests yet
          </p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
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
                      <p className="font-bold text-lg text-gray-900">
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

                <div className="bg-gray-50 rounded p-3 text-sm">
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

                {withdrawal.adminNote && (
                  <div className="mt-3 bg-blue-50 border-l-4 border-blue-600 p-3">
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
