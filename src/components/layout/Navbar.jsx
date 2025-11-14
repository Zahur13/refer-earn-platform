import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Wallet, User, Settings } from "lucide-react";
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
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <Link
              to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
              className="flex items-center"
            >
              <div className="bg-primary-600 text-white font-bold text-xl px-3 py-1 rounded-lg">
                R&E
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                Refer & Earn
              </span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {!isAdmin && (
              <div className="hidden md:flex items-center bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-xs text-green-600">Wallet Balance</p>
                  <p className="font-bold text-green-700">
                    {formatCurrency(userData?.wallet?.balance || 0)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-4">
              {!isAdmin && (
                <div className="hidden md:flex items-center bg-green-50 border border-green-200-200 px-4 py-2 rounded-lg">
                  {/* Notification Bell */}
                  <NotificationBell />
                </div>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="bg-primary-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold">
                    {userData?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {userData?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {userData?.email}
                        </p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
