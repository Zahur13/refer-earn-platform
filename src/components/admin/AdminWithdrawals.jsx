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
import { approveWithdrawal, rejectWithdrawal } from "../../api/vercelFunctions";

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
      // ✅ Call Vercel API
      const result = await approveWithdrawal(
        withdrawal.id,
        adminNote || "Approved and processed"
      );

      toast.success(result.message);
      setSelectedWithdrawal(null);
      setAdminNote("");
      fetchWithdrawals();
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast.error(error.message || "Failed to approve withdrawal");
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
      // ✅ Call Vercel API
      const result = await rejectWithdrawal(withdrawal.id, adminNote);

      toast.success(result.message);
      setSelectedWithdrawal(null);
      setAdminNote("");
      fetchWithdrawals();
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      toast.error(error.message || "Failed to reject withdrawal");
    } finally {
      setProcessing(null);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-yellow-50 border-yellow-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">
                {
                  withdrawals.filter(
                    (w) => w.status === WITHDRAWAL_STATUS.PENDING
                  ).length
                }
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 border-green-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700">Approved</p>
              <p className="text-3xl font-bold text-green-900">
                {
                  withdrawals.filter(
                    (w) => w.status === WITHDRAWAL_STATUS.APPROVED
                  ).length
                }
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border-red-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-red-700">Rejected</p>
              <p className="text-3xl font-bold text-red-900">
                {
                  withdrawals.filter(
                    (w) => w.status === WITHDRAWAL_STATUS.REJECTED
                  ).length
                }
              </p>
            </div>
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full input-field md:w-64"
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
          <div className="py-12 text-center card">
            <DollarSign className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <p className="text-gray-500">No withdrawals found</p>
          </div>
        ) : (
          filteredWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="transition card hover:shadow-xl"
            >
              <div className="flex flex-col justify-between lg:flex-row">
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1 space-x-2">
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
                  {/* // In the withdrawal details section, replace bank details
                  with: */}
                  <div className="p-3 text-sm bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">UPI ID:</span>
                      <span className="font-mono font-semibold">
                        {withdrawal.upiId}
                      </span>
                    </div>
                  </div>
                  {withdrawal.adminNote && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-600">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">Admin Note: </span>
                        {withdrawal.adminNote}
                      </p>
                    </div>
                  )}
                </div>

                {withdrawal.status === WITHDRAWAL_STATUS.PENDING && (
                  <div className="flex gap-3 mt-4 lg:ml-6 lg:mt-0 lg:flex-col lg:w-48">
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
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-lg bg-white rounded-xl">
            <div className="p-6">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                Review Withdrawal
              </h3>

              <div className="mb-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(selectedWithdrawal.amount)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="mb-2 text-sm text-gray-600">User Details</p>
                  <p className="font-semibold">{selectedWithdrawal.userName}</p>
                  <p className="text-sm text-gray-600">
                    {selectedWithdrawal.userEmail}
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
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
                  className="flex-1 px-4 py-2 font-semibold text-white bg-green-600 rounded-lg transition hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(selectedWithdrawal)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 font-semibold text-white bg-red-600 rounded-lg transition hover:bg-red-700 disabled:opacity-50"
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
