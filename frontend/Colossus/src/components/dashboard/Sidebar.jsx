import { Cloud, HardDrive, Files, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getInitials } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import toast from "react-hot-toast";

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
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

  const sidebarItem = isDark ? "sidebar-item-dark" : "sidebar-item-light";

  const logoSrc = isDark ? "/images/purple_nobg.png" : "/images/lavender_nobg.png";

  return (
    //Sidebar
    <aside className={`flex flex-col w-64 h-screen border-r py-6 px-3 shrink-0 backdrop-blur-xl ${isDark ? "border-white/5 bg-black/20" : "border-[#f0ebfe] bg-white/30"
      }`}>
      {/*Logo*/}
      <div className="flex items-center justify-between px-4 mb-8">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <img
              src={logoSrc}
              alt="Colossus logo"
              className="w-8 h-8 object-contain transition-opacity duration-300"
            />
          </div>
          <span className={`font-display font-bold text-lg tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
            Colossus
          </span>
          <div className="w-8 h-8 flex items-center justify-center">
            <img
              src={logoSrc}
              alt="Colossus logo"
              className="w-8 h-8 object-contain transition-opacity duration-300"
            />
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/*Nav*/}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`${sidebarItem} w-full ${activeTab === item.id ? "active" : ""}`}
          >
            {item.icon}
            <span className="font-body">{item.label}</span>
          </button>
        ))}
      </nav>

      {/*User*/}
      <div className={`border-t pt-4 mt-4 ${isDark ? "border-white/5" : "border-[#f0ebfe]"}`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={
            `w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "text-white" : "text-gray-900"} 
            text-sm font-display font-bold shrink-0 ${isDark ? "bg-gradient-to-br from-purple-600 to-violet-700" :
              "bg-gradient-to-br from-[#b89ef8] to-[#cab9fa]"
            }`}>
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate font-body ${isDark ? "text-white" : "text-gray-900"}`}>
              {user?.name}
            </p>
            <p className={`text-xs truncate font-body ${isDark ? "text-white/30" : "text-gray-400"}`}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`${sidebarItem} w-full mt-1 ${isDark ? "text-red-400/70 hover:text-red-400 hover:bg-red-500/5" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}
        >
          <LogOut size={16} />
          <span className="font-body">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
