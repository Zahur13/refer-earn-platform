// src/components/admin/AdminActivations.jsx

import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { approveActivation, rejectActivation } from "../../api/vercelFunctions";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { ACTIVATION_STATUS } from "../../utils/constants";
import toast from "react-hot-toast";

const AdminActivations = () => {
  const [activationRequests, setActivationRequests] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchActivationRequests();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivationRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterRequests();
  }, [filter, activationRequests]);

  const fetchActivationRequests = async () => {
    try {
      console.log("📥 Fetching activation requests...");

      const q = query(
        collection(db, "activationRequests"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // console.log("✅ Fetched activation requests:", data.length);

      setActivationRequests(data);
    } catch (error) {
      console.error("❌ Error fetching activation requests:", error);
      toast.error("Failed to load activation requests");
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (filter === "ALL") {
      setFilteredRequests(activationRequests);
    } else {
      setFilteredRequests(
        activationRequests.filter((req) => req.status === filter)
      );
    }
  };

  const handleApprove = async (request) => {
    if (
      !window.confirm(
        `Approve activation for ${request.userName}?\n\nThis will:\n- Activate their account\n- Process ₹${request.amount} payment\n- Credit referral bonus if applicable`
      )
    ) {
      return;
    }

    setProcessing(request.id);

    try {
      // console.log("✅ Approving activation:", request.id);
      const result = await approveActivation(request.id);

      toast.success(result.message);
      setSelectedRequest(null);
      setAdminNote("");
      fetchActivationRequests();
    } catch (error) {
      console.error("❌ Error approving activation:", error);
      toast.error(error.message || "Failed to approve activation");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request) => {
    if (!adminNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (
      !window.confirm(`Reject activation request from ${request.userName}?`)
    ) {
      return;
    }

    setProcessing(request.id);

    try {
      const result = await rejectActivation(request.id, adminNote);

      toast.success(result.message);
      setSelectedRequest(null);
      setAdminNote("");
      fetchActivationRequests();
    } catch (error) {
      console.error("❌ Error rejecting activation:", error);
      toast.error(error.message || "Failed to reject activation");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ACTIVATION_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case ACTIVATION_STATUS.APPROVED:
        return "bg-green-100 text-green-800";
      case ACTIVATION_STATUS.REJECTED:
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
          Activation Requests
        </h1>
        <button onClick={fetchActivationRequests} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-yellow-50 border-yellow-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">
                {
                  activationRequests.filter(
                    (r) => r.status === ACTIVATION_STATUS.PENDING
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
                  activationRequests.filter(
                    (r) => r.status === ACTIVATION_STATUS.APPROVED
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
                  activationRequests.filter(
                    (r) => r.status === ACTIVATION_STATUS.REJECTED
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
          <option value="PENDING">Pending Requests</option>
          <option value="APPROVED">Approved Requests</option>
          <option value="REJECTED">Rejected Requests</option>
          <option value="ALL">All Requests</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center card">
            <Clock className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <p className="text-gray-500">No activation requests found</p>
            <p className="mt-2 text-sm text-gray-400">
              {filter === "PENDING"
                ? "Waiting for users to submit activation requests"
                : `No ${filter.toLowerCase()} requests`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="transition card hover:shadow-xl">
              <div className="flex flex-col justify-between lg:flex-row">
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1 space-x-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {request.userName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{request.userEmail}</p>
                      <p className="text-sm text-gray-500">
                        {request.userPhone}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested: {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary-600">
                        {formatCurrency(request.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Details with UTR */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="flex items-center mb-2 text-sm font-semibold text-gray-700">
                      💳 Payment Details:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">UTR Number:</span>
                        <span className="ml-2 font-mono text-lg font-semibold text-primary-600">
                          {request.utrNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(request.amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Referrer Info */}
                  {request.hasReferrer && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="flex items-center mb-2 text-sm font-semibold text-blue-700">
                        <User className="mr-2 w-4 h-4" />
                        Referral Information:
                      </p>
                      <div className="text-sm">
                        <span className="text-gray-600">Referred by:</span>
                        <span className="ml-2 font-semibold">
                          {request.referrerName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-blue-600">
                        💰 Referrer will receive ₹10 bonus upon approval
                      </p>
                    </div>
                  )}

                  {/* Admin Note */}
                  {request.adminNote && (
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-600">
                      <p className="text-sm text-yellow-900">
                        <span className="font-semibold">
                          {request.status === ACTIVATION_STATUS.REJECTED
                            ? "Rejection Reason: "
                            : "Admin Note: "}
                        </span>
                        {request.adminNote}
                      </p>
                    </div>
                  )}
                </div>

                {request.status === ACTIVATION_STATUS.PENDING && (
                  <div className="flex gap-3 mt-4 lg:ml-6 lg:mt-0 lg:flex-col lg:w-48">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 btn-primary"
                      disabled={processing === request.id}
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
      {selectedRequest && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                Review Activation Request
              </h3>

              <div className="mb-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">User</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedRequest.userName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.userEmail}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="mb-1 text-sm text-gray-600">Payment Amount</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(selectedRequest.amount)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="mb-1 text-sm text-gray-600">UTR Number</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">
                    {selectedRequest.utrNumber}
                  </p>
                </div>

                {selectedRequest.hasReferrer && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This user was referred by{" "}
                      <strong>{selectedRequest.referrerName}</strong>. Upon
                      approval, referrer will receive ₹10 bonus.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Admin Note (Optional for approval, required for rejection)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="input-field"
                    rows="3"
                    placeholder="Add a note..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 font-semibold text-white bg-green-600 rounded-lg transition hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "✓ Approve"}
                </button>
                <button
                  onClick={() => handleReject(selectedRequest)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 font-semibold text-white bg-red-600 rounded-lg transition hover:bg-red-700 disabled:opacity-50"
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
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

export default AdminActivations;
