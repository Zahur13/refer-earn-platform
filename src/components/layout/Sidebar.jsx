import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Wallet,
  TrendingUp,
  History,
  DollarSign,
  Gift,
  Activity,
  MessageCircle,
} from "lucide-react";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { isAdmin } = useAuth();

  const userMenuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/user/dashboard" },
    { name: "Withdraw", icon: DollarSign, path: "/user/withdraw" },
    { name: "Referrals", icon: Users, path: "/user/referrals" },
    { name: "Transactions", icon: History, path: "/user/transactions" },
    { name: "Support", icon: MessageCircle, path: "/user/support" },
  ];

  const adminMenuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Users", icon: Users, path: "/admin/users" },
    { name: "Withdrawals", icon: DollarSign, path: "/admin/withdrawals" },
    { name: "Transactions", icon: Activity, path: "/admin/transactions" },
    { name: "Activations", icon: Gift, path: "/admin/activations" },
    { name: "Statistics", icon: TrendingUp, path: "/admin/stats" },
    { name: "My Earnings", icon: Wallet, path: "/admin/earnings" },
    { name: "Support Tickets", icon: MessageCircle, path: "/admin/support" },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white  border-r border-gray-200  z-30 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                    : "text-gray-700  hover:bg-gray-100 "
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
