import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import {
  MessageCircle,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  Eye,
  Send,
  User,
  X,
} from "lucide-react";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [filter, tickets]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "supportTickets"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const ticketsData = [];
      snapshot.forEach((doc) => {
        ticketsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setTickets(ticketsData);

      if (ticketsData.length === 0) {
        toast.info("No support tickets found");
      }
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    if (filter === "ALL") {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter((ticket) => ticket.status === filter);
      setFilteredTickets(filtered);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const openTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText("");
  };

  const closeTicketDetails = () => {
    setSelectedTicket(null);
    setReplyText("");
  };

  const markAsResolved = async (ticketId) => {
    if (!confirm("Mark this ticket as resolved?")) return;

    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: "RESOLVED",
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Ticket marked as resolved");
      await fetchTickets();
      closeTicketDetails();
    } catch (error) {
      toast.error("Failed to resolve ticket");
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    if (!selectedTicket) return;

    try {
      const replyData = {
        message: replyText,
        sender: "admin",
        sentAt: Timestamp.now(),
      };

      await updateDoc(doc(db, "supportTickets", selectedTicket.id), {
        status: "REPLIED",
        lastReply: replyText,
        repliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        replies: arrayUnion(replyData),
      });

      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        userId: selectedTicket.userId,
        type: "SUPPORT_REPLY",
        title: "Admin Replied to Your Ticket",
        message: `You have a new reply on: "${selectedTicket.subject}"`,
        ticketId: selectedTicket.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      toast.success("Reply sent! User will see it in their Support panel.");
      setReplyText("");
      await fetchTickets();
      closeTicketDetails();
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const pendingCount = tickets.filter((t) => t.status === "PENDING").length;
  const repliedCount = tickets.filter((t) => t.status === "REPLIED").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-1 text-gray-600">Total: {tickets.length} tickets</p>
        </div>
        <button onClick={fetchTickets} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="bg-yellow-50 border-yellow-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">
                {pendingCount}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-blue-50 border-blue-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-700">Replied</p>
              <p className="text-3xl font-bold text-blue-900">{repliedCount}</p>
            </div>
            <Send className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border-green-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700">Resolved</p>
              <p className="text-3xl font-bold text-green-900">
                {resolvedCount}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 border-purple-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-purple-700">Total</p>
              <p className="text-3xl font-bold text-purple-900">
                {tickets.length}
              </p>
            </div>
            <MessageCircle className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleFilterChange("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "PENDING"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => handleFilterChange("REPLIED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "REPLIED"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Replied ({repliedCount})
          </button>
          <button
            onClick={() => handleFilterChange("RESOLVED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "RESOLVED"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => handleFilterChange("ALL")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "ALL"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({tickets.length})
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center card">
            <MessageCircle className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <p className="text-gray-500">
              No {filter.toLowerCase()} tickets found
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
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
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{ticket.userName}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <a
                        href={`mailto:${ticket.userEmail}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {ticket.userEmail}
                      </a>
                    </div>
                    {ticket.userPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {ticket.userPhone}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {ticket.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 lg:mt-0 lg:ml-6 lg:flex-col lg:w-48">
                  <button
                    onClick={() => openTicketDetails(ticket)}
                    className="flex flex-1 justify-center items-center btn-primary"
                  >
                    <Eye className="mr-2 w-4 h-4" />
                    View Details
                  </button>
                  {ticket.status !== "RESOLVED" && (
                    <button
                      onClick={() => markAsResolved(ticket.id)}
                      className="flex flex-1 justify-center items-center btn-secondary"
                    >
                      <CheckCircle className="mr-2 w-4 h-4" />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center space-x-2">
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
                    <span className="text-sm text-gray-500">
                      Ticket #{selectedTicket.id.substring(0, 8)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeTicketDetails}
                  className="text-2xl font-bold text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 mb-6 bg-gray-50 rounded-lg sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Name
                  </label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedTicket.userName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Email
                  </label>
                  <p className="mt-1 font-semibold text-gray-900 break-all">
                    <a
                      href={`mailto:${selectedTicket.userEmail}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {selectedTicket.userEmail}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Phone
                  </label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedTicket.userPhone || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="p-3 mb-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>📅 Submitted:</strong>{" "}
                  {formatDate(selectedTicket.createdAt)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-semibold text-gray-700 uppercase">
                  User's Message
                </label>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
                  <p className="leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {selectedTicket.lastReply && (
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-semibold text-gray-700 uppercase">
                    Your Last Reply
                    <span className="ml-2 text-xs text-gray-500 normal-case">
                      (Sent on {formatDate(selectedTicket.repliedAt)})
                    </span>
                  </label>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-600">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedTicket.lastReply}
                    </p>
                  </div>
                </div>
              )}

              <div className="my-6 border-t border-gray-200"></div>

              {selectedTicket.status !== "RESOLVED" && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-gray-900">
                    Reply to User
                  </h4>

                  <div className="p-5 rounded-lg border border-primary-200 bg-primary-50">
                    <div className="flex items-start mb-3 space-x-3">
                      <div className="p-2 rounded-lg bg-primary-600">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900">
                          Option 1: Quick Reply
                        </h5>
                        <p className="text-sm text-gray-600">
                          Send reply directly (user sees in Support panel)
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="mb-3 w-full resize-none input-field"
                      rows="5"
                      placeholder="Type your reply here..."
                    />

                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim()}
                      className="flex justify-center items-center w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="mr-2 w-4 h-4" />
                      Send Quick Reply
                    </button>

                    <p className="mt-2 text-xs text-gray-500">
                      ✓ Reply appears in user's Support panel
                    </p>
                  </div>

                  <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start mb-3 space-x-3">
                      <div className="p-2 bg-gray-600 rounded-lg">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900">
                          Option 2: Use Your Email Client
                        </h5>
                        <p className="text-sm text-gray-600">
                          Opens Gmail/Outlook with pre-filled recipient
                        </p>
                      </div>
                    </div>

                    <a
                      href={`mailto:${
                        selectedTicket.userEmail
                      }?subject=Re: ${encodeURIComponent(
                        selectedTicket.subject
                      )}&body=Hi ${
                        selectedTicket.userName
                      },%0D%0A%0D%0AThank you for contacting Refer & Earn Support.%0D%0A%0D%0ARegarding your query: "${
                        selectedTicket.subject
                      }"%0D%0A%0D%0A[Type your response here]%0D%0A%0D%0ABest regards,%0D%0ARefer & Earn Support Team`}
                      className="flex justify-center items-center w-full text-center btn-secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Mail className="mr-2 w-4 h-4" />
                      Open in Email Client
                    </a>

                    <p className="mt-2 text-xs text-gray-500">
                      ℹ️ Opens your default email app
                    </p>
                  </div>
                </div>
              )}

              {selectedTicket.status === "RESOLVED" && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-semibold">
                      This ticket has been resolved
                    </p>
                  </div>
                  {selectedTicket.resolvedAt && (
                    <p className="mt-1 text-sm text-green-700">
                      Resolved on: {formatDate(selectedTicket.resolvedAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="my-6 border-t border-gray-200"></div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {selectedTicket.status !== "RESOLVED" ? (
                  <>
                    <button
                      onClick={() => markAsResolved(selectedTicket.id)}
                      className="flex flex-1 justify-center items-center px-4 py-3 font-semibold text-white bg-green-600 rounded-lg transition hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 w-5 h-5" />
                      Mark as Resolved
                    </button>
                    <button
                      onClick={closeTicketDetails}
                      className="flex flex-1 justify-center items-center px-4 py-3 font-semibold text-white bg-gray-600 rounded-lg transition hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <button
                    onClick={closeTicketDetails}
                    className="flex justify-center items-center px-4 py-3 w-full font-semibold text-white rounded-lg transition bg-primary-600 hover:bg-primary-700"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
