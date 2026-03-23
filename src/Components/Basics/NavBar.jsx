import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../Auth/AuthContext.jsx";

const NavBar = ({ title = "Dashboard", onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userName =
    user?.displayName || user?.email?.split("@")[0] || user?.role || "User";

  return (
    <header className="sticky top-0 w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50">
      <div className="flex items-center justify-between p-4 lg:px-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-white"
            aria-label="Open menu"
            type="button"
          >
            <Menu />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-sm flex items-center justify-center transform rotate-45">
            <div className="w-3 h-3 bg-white rounded-full -rotate-45" />
          </div>
          <span className="text-xl lg:text-2xl font-syncopate font-bold tracking-tighter text-white">
            LogisticsPro<span className="text-orange-500">.</span>
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              {title}
            </span>
            <span className="text-white text-xs font-medium">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-900/40 hover:bg-red-700 text-white px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <button
          className="md:hidden p-2 text-white"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          type="button"
          aria-label="Toggle mobile menu"
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-4 flex flex-col">
          <div className="w-full text-left px-2 py-2 text-sm text-slate-300">
            {userName}
          </div>
          <button
            className="w-full bg-red-900 text-white p-2 rounded-sm text-xs font-bold uppercase"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default NavBar;
