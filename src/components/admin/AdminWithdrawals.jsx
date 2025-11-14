import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import {
  WITHDRAWAL_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} from "../../utils/constants";
import toast from "react-hot-toast";

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    filterWithdrawals();
  }, [filter, withdrawals]);

  const fetchWithdrawals = async () => {
    try {
      const snapshot = await getDocs(collection(db, "withdrawals"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWithdrawals(data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    if (filter === "ALL") {
      setFilteredWithdrawals(withdrawals);
    } else {
      setFilteredWithdrawals(withdrawals.filter((w) => w.status === filter));
    }
  };

  const handleApprove = async (withdrawal) => {
    if (
      !window.confirm(
        `Approve withdrawal of ${formatCurrency(withdrawal.amount)} for ${
          withdrawal.userName
        }?`
      )
    ) {
      return;
    }

    setProcessing(withdrawal.id);

    try {
      // Update withdrawal status
      await updateDoc(doc(db, "withdrawals", withdrawal.id), {
        status: WITHDRAWAL_STATUS.APPROVED,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminNote: adminNote || "Approved and processed",
      });

      // Deduct from user wallet
      await updateDoc(doc(db, "users", withdrawal.userId), {
        "wallet.balance": increment(-withdrawal.amount),
        "wallet.lastUpdated": serverTimestamp(),
      });

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        type: TRANSACTION_TYPES.WITHDRAWAL,
        status: TRANSACTION_STATUS.SUCCESS,
        description: `Withdrawal to bank account ****${withdrawal.bankDetails.accountNumber.slice(
          -4
        )}`,
        withdrawalId: withdrawal.id,
        createdAt: serverTimestamp(),
      });

      toast.success("Withdrawal approved successfully");
      setSelectedWithdrawal(null);
      setAdminNote("");
      fetchWithdrawals();
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast.error("Failed to approve withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (withdrawal) => {
    if (!adminNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (
      !window.confirm(
        `Reject withdrawal of ${formatCurrency(withdrawal.amount)}?`
      )
    ) {
      return;
    }

    setProcessing(withdrawal.id);

    try {
      await updateDoc(doc(db, "withdrawals", withdrawal.id), {
        status: WITHDRAWAL_STATUS.REJECTED,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminNote: adminNote,
      });

      toast.success("Withdrawal rejected");
      setSelectedWithdrawal(null);
      setAdminNote("");
      fetchWithdrawals();
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      toast.error("Failed to reject withdrawal");
    } finally {
      setProcessing(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Withdrawal Management
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">
                {
                  withdrawals.filter(
                    (w) => w.status === WITHDRAWAL_STATUS.PENDING
                  ).length
                }
              </p>
            </div>
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-900">
                {
                  withdrawals.filter(
                    (w) => w.status === WITHDRAWAL_STATUS.APPROVED
                  ).length
                }
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-900">
                {
                  withdrawals.filter(
                    (w) => w.status === WITHDRAWAL_STATUS.REJECTED
                  ).length
                }
              </p>
            </div>
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-full md:w-64"
        >
          <option value="PENDING">Pending Withdrawals</option>
          <option value="APPROVED">Approved Withdrawals</option>
          <option value="REJECTED">Rejected Withdrawals</option>
          <option value="ALL">All Withdrawals</option>
        </select>
      </div>

      {/* Withdrawals List */}
      <div className="space-y-4">
        {filteredWithdrawals.length === 0 ? (
          <div className="card text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No withdrawals found</p>
          </div>
        ) : (
          filteredWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="card hover:shadow-xl transition"
            >
              <div className="flex flex-col lg:flex-row justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {withdrawal.userName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            withdrawal.status
                          )}`}
                        >
                          {withdrawal.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{withdrawal.userEmail}</p>
                      <p className="text-sm text-gray-500">
                        Requested: {formatDate(withdrawal.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary-600">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Bank Details:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Account Holder:</span>
                        <span className="ml-2 font-semibold">
                          {withdrawal.bankDetails.accountHolderName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Bank:</span>
                        <span className="ml-2 font-semibold">
                          {withdrawal.bankDetails.bankName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Account Number:</span>
                        <span className="ml-2 font-semibold">
                          {withdrawal.bankDetails.accountNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">IFSC:</span>
                        <span className="ml-2 font-semibold">
                          {withdrawal.bankDetails.ifscCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {withdrawal.adminNote && (
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-3">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">Admin Note: </span>
                        {withdrawal.adminNote}
                      </p>
                    </div>
                  )}
                </div>

                {withdrawal.status === WITHDRAWAL_STATUS.PENDING && (
                  <div className="lg:ml-6 mt-4 lg:mt-0 flex lg:flex-col gap-3 lg:w-48">
                    <button
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                      className="flex-1 btn-primary"
                      disabled={processing === withdrawal.id}
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Review Withdrawal
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(selectedWithdrawal.amount)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">User Details</p>
                  <p className="font-semibold">{selectedWithdrawal.userName}</p>
                  <p className="text-sm text-gray-600">
                    {selectedWithdrawal.userEmail}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Note
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="input-field"
                    rows="3"
                    placeholder="Add a note (required for rejection)"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedWithdrawal)}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(selectedWithdrawal)}
                  disabled={processing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setAdminNote("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
