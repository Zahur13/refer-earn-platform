import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  MessageCircle,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
  Send,
  User,
} from "lucide-react";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      console.log("📥 Fetching support tickets...");

      const q = query(
        collection(db, "supportTickets"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("✅ Fetched tickets:", data.length);
      setTickets(data);
    } catch (error) {
      console.error("❌ Error fetching support tickets:", error);
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (ticketId) => {
    if (!window.confirm("Mark this ticket as resolved?")) {
      return;
    }

    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: "RESOLVED",
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Ticket marked as resolved");
      fetchTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  const markAsPending = async (ticketId) => {
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: "PENDING",
        updatedAt: serverTimestamp(),
      });

      toast.success("Ticket marked as pending");
      fetchTickets();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  const sendReplyEmail = async (ticket) => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setSendingReply(true);

    try {
      // Send reply via FormSubmit
      const formData = new URLSearchParams({
        _subject: `Re: ${ticket.subject}`,
        _template: "box",
        _captcha: "false",
        To: ticket.userEmail,
        From: "Refer & Earn Support",
        TicketID: ticket.id,
        OriginalSubject: ticket.subject,
        Reply: replyMessage,
      });

      const response = await fetch(
        `https://formsubmit.co/ajax/${ticket.userEmail}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: formData.toString(),
        }
      );

      const result = await response.json();

      if (result.success === "true" || response.ok) {
        // Update ticket with reply
        await updateDoc(doc(db, "supportTickets", ticket.id), {
          status: "REPLIED",
          lastReply: replyMessage,
          repliedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast.success("Reply sent successfully!");
        setReplyMessage("");
        fetchTickets();
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error(
        "Failed to send reply. You can use the 'Reply via Email' button instead."
      );
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-1 text-gray-600">Manage user support requests</p>
        </div>
        <button onClick={fetchTickets} className="btn-secondary">
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="bg-yellow-50 border-yellow-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">
                {tickets.filter((t) => t.status === "PENDING").length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-blue-50 border-blue-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-700">Replied</p>
              <p className="text-3xl font-bold text-blue-900">
                {tickets.filter((t) => t.status === "REPLIED").length}
              </p>
            </div>
            <Send className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border-green-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700">Resolved</p>
              <p className="text-3xl font-bold text-green-900">
                {tickets.filter((t) => t.status === "RESOLVED").length}
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

      {/* Filter */}
      <div className="card">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full input-field md:w-64"
        >
          <option value="PENDING">Pending Tickets</option>
          <option value="REPLIED">Replied Tickets</option>
          <option value="RESOLVED">Resolved Tickets</option>
          <option value="ALL">All Tickets</option>
        </select>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center card">
            <MessageCircle className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <p className="text-gray-500">No support tickets found</p>
            <p className="mt-2 text-sm text-gray-400">
              {filter === "PENDING"
                ? "No pending tickets at the moment"
                : `No ${filter.toLowerCase()} tickets`}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="transition card hover:shadow-xl">
              <div className="flex flex-col justify-between lg:flex-row">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
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
                        <span className="font-medium">{ticket.userName}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted: {formatDate(ticket.createdAt)}
                      </p>
                      {ticket.repliedAt && (
                        <p className="text-sm text-blue-600">
                          Replied: {formatDate(ticket.repliedAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Ticket ID</p>
                      <p className="font-mono text-sm text-gray-700">
                        {ticket.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>

                  {/* User Contact Info */}
                  <div className="grid grid-cols-1 gap-3 p-3 text-sm bg-gray-50 rounded-lg sm:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="flex-shrink-0 w-4 h-4 text-gray-500" />
                      <a
                        href={`mailto:${ticket.userEmail}`}
                        className="break-all text-primary-600 hover:text-primary-700"
                      >
                        {ticket.userEmail}
                      </a>
                    </div>
                    {ticket.userPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="flex-shrink-0 w-4 h-4 text-gray-500" />
                        <a
                          href={`tel:${ticket.userPhone}`}
                          className="text-gray-700 hover:text-primary-600"
                        >
                          {ticket.userPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Message Preview */}
                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {ticket.message}
                    </p>
                  </div>

                  {/* Last Reply Preview */}
                  {ticket.lastReply && (
                    <div className="p-3 bg-green-50 rounded border-l-4 border-green-600">
                      <p className="mb-1 text-xs font-semibold text-green-800">
                        Last Reply:
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {ticket.lastReply}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 lg:ml-6 lg:mt-0 lg:flex-col lg:w-48">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
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

                  {ticket.status === "RESOLVED" && (
                    <button
                      onClick={() => markAsPending(ticket.id)}
                      className="flex flex-1 justify-center items-center px-4 py-2 text-white bg-yellow-600 rounded-lg transition hover:bg-yellow-700"
                    >
                      <Clock className="mr-2 w-4 h-4" />
                      Reopen
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
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">
                    Ticket Details
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
                      ID: {selectedTicket.id.substring(0, 12)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setReplyMessage("");
                  }}
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Subject
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Submitted
                    </label>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Name
                    </label>
                    <p className="font-semibold text-gray-900">
                      {selectedTicket.userName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Email
                    </label>
                    <p className="font-semibold text-gray-900 break-all">
                      <a
                        href={`mailto:${selectedTicket.userEmail}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {selectedTicket.userEmail}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Phone
                    </label>
                    <p className="font-semibold text-gray-900">
                      {selectedTicket.userPhone || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Message
                  </label>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="leading-relaxed text-gray-800 whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                {/* Last Reply */}
                {selectedTicket.lastReply && (
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Your Last Reply
                      <span className="ml-2 text-xs text-gray-500">
                        ({formatDate(selectedTicket.repliedAt)})
                      </span>
                    </label>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="leading-relaxed text-gray-800 whitespace-pre-wrap">
                        {selectedTicket.lastReply}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reply Section */}
                {selectedTicket.status !== "RESOLVED" && (
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Send Reply
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="resize-none input-field"
                      rows="6"
                      placeholder="Type your reply here..."
                    />
                    <button
                      onClick={() => sendReplyEmail(selectedTicket)}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="mt-3 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? (
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
                          Sending...
                        </span>
                      ) : (
                        <span className="flex justify-center items-center">
                          <Send className="mr-2 w-4 h-4" />
                          Send Reply via Email
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <a
                    href={`mailto:${
                      selectedTicket.userEmail
                    }?subject=Re: ${encodeURIComponent(
                      selectedTicket.subject
                    )}&body=Hi ${
                      selectedTicket.userName
                    },%0D%0A%0D%0AThank you for contacting us.%0D%0A%0D%0ARegarding your query: "${
                      selectedTicket.subject
                    }"%0D%0A%0D%0A`}
                    className="flex flex-1 justify-center items-center text-center btn-secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail className="mr-2 w-4 h-4" />
                    Open in Email Client
                  </a>

                  {selectedTicket.status === "PENDING" ||
                  selectedTicket.status === "REPLIED" ? (
                    <button
                      onClick={() => markAsResolved(selectedTicket.id)}
                      className="flex flex-1 justify-center items-center px-4 py-2 text-white bg-green-600 rounded-lg transition hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 w-4 h-4" />
                      Mark as Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => markAsPending(selectedTicket.id)}
                      className="flex flex-1 justify-center items-center px-4 py-2 text-white bg-yellow-600 rounded-lg transition hover:bg-yellow-700"
                    >
                      <Clock className="mr-2 w-4 h-4" />
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
