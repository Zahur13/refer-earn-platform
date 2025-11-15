import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Wallet } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";
import NotificationBell from "../shared/NotificationBell";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { userData, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-md">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 mr-4 rounded-lg lg:hidden hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <Link
              to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
              className="flex items-center"
            >
              <div className="px-3 py-1 text-xl font-bold text-white rounded-lg bg-primary-600">
                R&E
              </div>
              <span className="hidden ml-2 text-xl font-bold text-gray-900 sm:block">
                Refer & Earn
              </span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Wallet Balance (User Only) */}
            {!isAdmin && (
              <div className="hidden items-center px-4 py-2 bg-green-50 rounded-lg border border-green-200 md:flex">
                <Wallet className="mr-2 w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-green-600">Wallet Balance</p>
                  <p className="font-bold text-green-700">
                    {formatCurrency(userData?.wallet?.balance || 0)}
                  </p>
                </div>
              </div>
            )}

            {/* ✅ Notification Bell */}
            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center p-2 space-x-2 rounded-lg hover:bg-gray-100"
              >
                <div className="flex justify-center items-center w-10 h-10 font-semibold text-white rounded-full bg-primary-600">
                  {userData?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {userData?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? "Admin" : "User"}
                  </p>
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 z-20 py-2 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-xl">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {userData?.name}
                      </p>
                      <p className="text-xs text-gray-500">{userData?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-4 py-2 space-x-2 w-full text-sm text-left text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
