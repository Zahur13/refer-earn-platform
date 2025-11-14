import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Search, UserCheck, UserX, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterStatus, users]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((u) => u.role !== "admin");
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by status
    if (filterStatus === "ACTIVE") {
      filtered = filtered.filter((u) => u.isReferralActive);
    } else if (filterStatus === "PENDING") {
      filtered = filtered.filter((u) => !u.isReferralActive);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
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
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="ALL">All Users</option>
            <option value="ACTIVE">Active Users</option>
            <option value="PENDING">Pending Activation</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                User
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Referral Code
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Wallet Balance
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Referrals
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Joined
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.phone}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {user.referralCode}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-green-600">
                  {formatCurrency(user.wallet?.balance || 0)}
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold">
                    {user.stats?.totalReferrals || 0}
                  </span>
                  <span className="text-gray-500 text-sm"> total</span>
                </td>
                <td className="py-3 px-4">
                  {user.isReferralActive ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center w-fit">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center w-fit">
                      <UserX className="h-3 w-3 mr-1" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(user.createdAt)}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <p className="text-gray-500 text-center py-12">No users found</p>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  User Details
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <p className="font-semibold">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-semibold">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="font-semibold">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Referral Code
                    </label>
                    <p className="font-mono font-semibold">
                      {selectedUser.referralCode}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Wallet Balance
                    </label>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(selectedUser.wallet?.balance || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p className="font-semibold">
                      {selectedUser.isReferralActive
                        ? "✅ Active"
                        : "⏳ Pending"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Total Referrals
                    </label>
                    <p className="font-semibold">
                      {selectedUser.stats?.totalReferrals || 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Total Earnings
                    </label>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(selectedUser.stats?.totalEarnings || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Referred By</label>
                    <p className="font-semibold">
                      {selectedUser.referredBy || "Direct"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Joined Date</label>
                    <p className="font-semibold">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
