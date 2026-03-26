import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/dashboard/Sidebar";
import DriveExplorer from "../components/explorer/DriveExplorer";
import DrivesPanel from "../components/drives/DrivesPanel";
import StoragePanel from "../components/drives/StoragePanel";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(() => {
    if (searchParams.get("drive_connected") || searchParams.get("drive_error")) {
      return("drives");
    }
    return "files";
  });

  const handleConnectDriveFromStorage = async () => {
    try {
      const res = await api.get("/drives/connect");
      window.location.href = res.data.url;
    } catch {
      toast.error("Failed to initiate Drive connection.");
    }
  };

  const subtitles = {
    files: "All files across all your connected drives",
    drives: "Manage your connected Google Drive accounts",
    storage: "Monitor your storage usage across all drives",
  };

  return (
    <div className="relative flex h-screen overflow-hidden font-body">
      {/*Ibelick background
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>*/}

      {/*Sidebar*/}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/*Main content*/}
      <main className={`flex-1 overflow-y-auto ${isDark ? "dark-scroll" : "light-scroll"}`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/*Page title*/}
          <div className="mb-8">
            <h1 className={`font-display text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {activeTab === "files" && "My Files"}
              {activeTab === "drives" && "Drive Accounts"}
              {activeTab === "storage" && "Storage Overview"}
            </h1>
            <p className={`font-body mt-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>
              {subtitles[activeTab]}
            </p>
          </div>

          {/*Panels*/}
          {activeTab === "files" && <DriveExplorer />}
          {activeTab === "drives" && <DrivesPanel />}
          {activeTab === "storage" && <StoragePanel onConnectDrive={handleConnectDriveFromStorage} />}
        </div>
      </main>
    </div>
  );
}
