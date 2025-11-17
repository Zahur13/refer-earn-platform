import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { auth, db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  MessageCircle,
  Mail,
  Send,
  CheckCircle,
  HelpCircle,
  Clock,
  Eye,
  X,
  User,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/helpers";

const Support = () => {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTab, setActiveTab] = useState("new"); // "new" or "history"

  useEffect(() => {
    if (userData) {
      fetchMyTickets();
    }
  }, [userData]);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const q = query(
        collection(db, "supportTickets"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const tickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMyTickets(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const token = await auth.currentUser.getIdToken();

      const response = await fetch("/api/submitSupportTicket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userName: userData.name,
          userEmail: userData.email,
          userPhone: userData.phone || "",
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setSubmitted(true);
      setFormData({ subject: "", message: "" });
      toast.success(result.message);

      // Refresh tickets
      await fetchMyTickets();

      setTimeout(() => {
        setSubmitted(false);
        setActiveTab("history"); // Switch to history tab
      }, 2000);
    } catch (error) {
      console.error("Support form error:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);

    // Mark notification as read if unread
    if (
      ticket.status === "REPLIED" &&
      ticket.replies &&
      ticket.replies.length > 0
    ) {
      // Update notification read status
      updateDoc(doc(db, "supportTickets", ticket.id), {
        lastViewedByUser: serverTimestamp(),
      }).catch((err) => console.error("Error updating view time:", err));
    }
  };

  const closeTicket = () => {
    setSelectedTicket(null);
  };

  return (
    <div className="mx-auto space-y-6 max-w-6xl">
      {/* Header */}
      <div className="text-white bg-gradient-to-r card from-primary-600 to-primary-700">
        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-full bg-white/20">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Support Center</h2>
            <p className="text-primary-100">Get help and view your tickets</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-2 border-b">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "new"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📝 New Ticket
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-semibold transition relative ${
              activeTab === "history"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📋 My Tickets ({myTickets.length})
            {myTickets.filter(
              (t) => t.status === "REPLIED" && !t.lastViewedByUser
            ).length > 0 && (
              <span className="flex absolute -top-1 -right-1 justify-center items-center w-5 h-5 text-xs text-white bg-red-500 rounded-full">
                {
                  myTickets.filter(
                    (t) => t.status === "REPLIED" && !t.lastViewedByUser
                  ).length
                }
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "new" ? (
        /* NEW TICKET FORM */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <div className="card">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Mail className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Email Support</h3>
                  <p className="mt-1 text-sm text-gray-600 break-all">
                    refernearnplatform@gmail.com
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-blue-200 card">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Response Time</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    We typically respond within 24 hours
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Mon-Fri: 9 AM - 6 PM IST
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-yellow-200 card">
              <h3 className="flex items-center mb-3 font-semibold text-gray-900">
                <span className="mr-2">💡</span> Common Topics
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Account activation issues</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Payment verification</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Withdrawal requests</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Referral code problems</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="inline-flex justify-center items-center mb-4 w-16 h-16 bg-green-100 rounded-full">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">
                    Ticket Submitted!
                  </h3>
                  <p className="mb-2 text-gray-600">
                    Thank you for contacting us. We've received your ticket.
                  </p>
                  <p className="mb-4 text-sm text-gray-500">
                    ✅ Admin will reply in the Support Center
                    <br />✅ You'll get a notification when admin replies
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setActiveTab("history");
                    }}
                    className="mt-4 btn-primary"
                  >
                    View My Tickets
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="mb-1 text-xl font-bold text-gray-900">
                    Create New Ticket
                  </h3>
                  <p className="mb-6 text-sm text-gray-600">
                    Fill out the form below and we'll get back to you soon
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 sm:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-600">
                          Your Name
                        </label>
                        <p className="text-sm font-semibold text-gray-900">
                          {userData?.name}
                        </p>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-600">
                          Your Email
                        </label>
                        <p className="text-sm font-semibold text-gray-900 break-all">
                          {userData?.email}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g., Payment not verified, Withdrawal issue, etc."
                        required
                        maxLength="100"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="resize-none input-field"
                        rows="8"
                        placeholder="Please describe your issue or question in detail..."
                        required
                        maxLength="1000"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.message.length}/1000 characters
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>💬 What happens next:</strong>
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-blue-700">
                        <li>✓ Your ticket will be sent to admin</li>
                        <li>✓ Admin replies appear in "My Tickets" tab</li>
                        <li>✓ You'll get a notification when admin replies</li>
                        <li>✓ Response within 24 hours</li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="py-3 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex justify-center items-center">
                          <svg
                            className="mr-3 -ml-1 w-5 h-5 text-white animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex justify-center items-center">
                          <Send className="mr-2 w-5 h-5" />
                          Submit Ticket
                        </span>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* MY TICKETS HISTORY */
        <div className="space-y-4">
          {loadingTickets ? (
            <div className="py-12 text-center card">
              <div className="mx-auto w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="py-12 text-center card">
              <MessageCircle className="mx-auto mb-4 w-16 h-16 text-gray-300" />
              <p className="mb-2 text-gray-500">No tickets yet</p>
              <p className="mb-4 text-sm text-gray-400">
                Create your first support ticket to get help
              </p>
              <button
                onClick={() => setActiveTab("new")}
                className="btn-primary"
              >
                Create New Ticket
              </button>
            </div>
          ) : (
            myTickets.map((ticket) => (
              <div key={ticket.id} className="transition card hover:shadow-lg">
                <div className="flex flex-col justify-between lg:flex-row">
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1 space-x-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {ticket.subject}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              ticket.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : ticket.status === "REPLIED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {ticket.status}
                          </span>
                          {ticket.status === "REPLIED" &&
                            !ticket.lastViewedByUser && (
                              <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full animate-pulse">
                                New Reply!
                              </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(ticket.createdAt)}
                        </p>
                        {ticket.repliedAt && (
                          <p className="text-sm text-blue-600">
                            Last reply: {formatDate(ticket.repliedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {ticket.message}
                      </p>
                    </div>

                    {ticket.lastReply && (
                      <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
                        <p className="mb-1 text-xs font-semibold text-blue-800">
                          Admin's Reply:
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {ticket.lastReply}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4 lg:mt-0 lg:ml-6 lg:flex-col lg:w-48">
                    <button
                      onClick={() => openTicket(ticket)}
                      className="flex flex-1 justify-center items-center btn-primary"
                    >
                      <Eye className="mr-2 w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">
                    {selectedTicket.subject}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedTicket.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedTicket.status === "REPLIED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <button
                  onClick={closeTicket}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Conversation Thread */}
              <div className="mb-6 space-y-4">
                {/* Original Message */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary-100">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="p-4 rounded-lg border-l-4 bg-primary-50 border-primary-600">
                      <div className="flex items-center mb-2 space-x-2">
                        <p className="font-semibold text-gray-900">You</p>
                        <span className="text-xs text-gray-500">
                          {formatDate(selectedTicket.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Replies */}
                {selectedTicket.replies &&
                  selectedTicket.replies.length > 0 &&
                  selectedTicket.replies.map((reply, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex justify-center items-center w-10 h-10 bg-green-100 rounded-full">
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
                          <div className="flex items-center mb-2 space-x-2">
                            <p className="font-semibold text-gray-900">
                              Admin Support
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(reply.sentAt)}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {selectedTicket.status === "PENDING" && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⏳ <strong>Waiting for admin response...</strong> We'll
                    notify you when admin replies.
                  </p>
                </div>
              )}

              {selectedTicket.status === "RESOLVED" && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    ✅ <strong>This ticket has been resolved.</strong> If you
                    need further help, please create a new ticket.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button onClick={closeTicket} className="btn-primary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
