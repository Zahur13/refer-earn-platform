import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Menu, LogOut, TrendingUp, User, Wallet } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

import NotificationBell from "../shared/NotificationBell";
// import ThemeToggle from "../shared/ThemeToggle"; // ✅ Add this import

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, userData, signOut, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-colors duration-200">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo & Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 rounded-lg transition lg:hidden hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br to-purple-600 rounded-lg from-primary-600">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Refer & Earn
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
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
