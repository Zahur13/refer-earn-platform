import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { MessageCircle, Mail, Phone, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const q = query(
        collection(db, "supportTickets"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTickets(data);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (ticketId) => {
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: "RESOLVED",
        resolvedAt: new Date(),
      });

      toast.success("Ticket marked as resolved");
      fetchTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  const filteredTickets = tickets.filter((t) =>
    filter === "ALL" ? true : t.status === filter
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

        <div className="bg-blue-50 border-blue-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-700">Total</p>
              <p className="text-3xl font-bold text-blue-900">
                {tickets.length}
              </p>
            </div>
            <MessageCircle className="w-12 h-12 text-blue-600" />
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
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="transition card hover:shadow-xl">
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
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{ticket.userName}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* User Contact Info */}
                  <div className="grid grid-cols-2 gap-4 p-3 text-sm bg-gray-50 rounded">
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
                        <span>{ticket.userPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Message Preview */}
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-600">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {ticket.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 lg:ml-6 lg:mt-0 lg:flex-col lg:w-48">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-1 btn-secondary"
                  >
                    View Details
                  </button>
                  {ticket.status === "PENDING" && (
                    <button
                      onClick={() => markAsResolved(ticket.id)}
                      className="flex-1 btn-primary"
                    >
                      Mark Resolved
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Ticket Details
                </h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Subject</label>
                  <p className="text-lg font-semibold">
                    {selectedTicket.subject}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <p className="font-semibold">{selectedTicket.userName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p className="font-semibold">{selectedTicket.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-semibold break-all">
                      <a
                        href={`mailto:${selectedTicket.userEmail}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {selectedTicket.userEmail}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="font-semibold">
                      {selectedTicket.userPhone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Submitted At</label>
                  <p className="font-semibold">
                    {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    Message
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <a
                    href={`mailto:${
                      selectedTicket.userEmail
                    }?subject=Re: ${encodeURIComponent(
                      selectedTicket.subject
                    )}`}
                    className="flex-1 text-center btn-primary"
                  >
                    Reply via Email
                  </a>
                  {selectedTicket.status === "PENDING" && (
                    <button
                      onClick={() => markAsResolved(selectedTicket.id)}
                      className="flex-1 btn-secondary"
                    >
                      Mark as Resolved
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
