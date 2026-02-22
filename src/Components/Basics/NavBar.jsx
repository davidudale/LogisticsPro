import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, Truck } from "lucide-react";
import { useAuth } from "../Auth/AuthContext.jsx";

const NavBar = ({ title = "Dashboard", onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("lp-theme") || "dark",
  );

  React.useEffect(() => {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("lp-theme", nextTheme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="w-full border-b top-0 border-slate-800/70 bg-slate-950/80 backdrop-blur right-0 left-0">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden rounded-full border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            aria-label="Open menu"
            title="Open menu"
            type="button"
          >
            <Menu size={16} />
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
            <Truck size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {user?.role || "role"}
            </p>
            <h1 className="text-lg font-bold text-white">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-full border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={handleLogout}
            className="lp-button-secondary flex items-center gap-2"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
