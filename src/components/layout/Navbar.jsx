import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Menu, LogOut, TrendingUp, User } from "lucide-react";
import NotificationBell from "../shared/NotificationBell";
import ThemeToggle from "../shared/ThemeToggle"; // ✅ Add this import

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, userData, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo & Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 rounded-lg transition dark:text-gray-300 lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br to-purple-600 rounded-lg from-primary-600">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Refer & Earn
              </span>
            </Link>
          </div>

          {/* Right side - Theme Toggle, Notifications, User */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle /> {/* ✅ Add this */}
              {/* Notifications */}
              <NotificationBell />
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {userData?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isAdmin ? "Admin" : "User"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900">
                    <User className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 rounded-lg transition dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
