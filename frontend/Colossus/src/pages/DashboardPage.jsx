import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import FilesPanel from "../components/files/FilesPanel";
import DrivesPanel from "../components/drives/DrivesPanel";
import StoragePanel from "../components/drives/StoragePanel";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("files");

  //If returning from OAuth callback with ?tab=drives, switch to drives tab
  useState(() => {
    if (searchParams.get("drive_connected") || searchParams.get("drive_error")) {
      setActiveTab("drives");
    }
  });

  const handleConnectDriveFromStorage = async () => {
    try {
      const res = await api.get("/drives/connect");
      window.location.href = res.data.url;
    } catch {
      toast.error("Failed to initiate Drive connection.");
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden font-body">
      {/*Ibelick background
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>*/}

      {/*Sidebar*/}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/*Main content*/}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/*Page title*/}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white">
              {activeTab === "files" && "My Files"}
              {activeTab === "drives" && "Drive Accounts"}
              {activeTab === "storage" && "Storage Overview"}
            </h1>
            <p className="text-white/30 font-body mt-1">
              {activeTab === "files" && "All files across all your connected drives"}
              {activeTab === "drives" && "Manage your connected Google Drive accounts"}
              {activeTab === "storage" && "Monitor your storage usage across all drives"}
            </p>
          </div>

          {/*Panels*/}
          {activeTab === "files" && <FilesPanel />}
          {activeTab === "drives" && <DrivesPanel />}
          {activeTab === "storage" && <StoragePanel onConnectDrive={handleConnectDriveFromStorage} />}
        </div>
      </main>
    </div>
  );
}
