import { Cloud, HardDrive, Files, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getInitials } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const navItems = [
    { id: "files", icon: <Files size={18} />, label: "My Files" },
    { id: "drives", icon: <HardDrive size={18} />, label: "Drive Accounts" },
    { id: "storage", icon: <Cloud size={18} />, label: "Storage" },
  ];

  return (
    //Sidebar
    <aside className="flex flex-col w-64 h-screen border-r border-white/5 bg-black/20 backdrop-blur-xl py-6 px-3 shrink-0">
      {/*Logo*/}
      <div className="flex items-center justify-between px-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
            <Cloud size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">Colossus</span>
        </div>
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-xs text-white/40 hover:text-white"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/*Nav*/}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-item w-full ${activeTab === item.id ? "active" : ""}`}
          >
            {item.icon}
            <span className="font-body">{item.label}</span>
          </button>
        ))}
      </nav>

      {/*User*/}
      <div className="border-t border-white/5 pt-4 mt-4">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white text-sm font-display font-bold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate font-body">{user?.name}</p>
            <p className="text-white/30 text-xs truncate font-body">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full mt-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/5"
        >
          <LogOut size={16} />
          <span className="font-body">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
