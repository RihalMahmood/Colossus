/*This component provides a dashboard for users to manage their connected Google Drive accounts, 
view total storage usage, and disconnect drives. It fetches drive data from the backend and displays it in 
an organized manner, allowing users to easily see how much storage they have available and which drives are connected*/
import { useEffect, useState } from "react";
import { HardDrive, RefreshCw, Trash2, PlusCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import { formatBytes, getUsagePercent } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function StoragePanel({ onConnectDrive }) {
  const { isDark } = useTheme();
  const [drives, setDrives] = useState([]);
  const [totalStorage, setTotalStorage] = useState({ total: 0, used: 0, free: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await api.get("/drives");
      setDrives(res.data.drives || []);
      setTotalStorage(res.data.totalStorage || { total: 0, used: 0, free: 0 });
    } catch {
      toast.error("Failed to load drive accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleDisconnect = async (driveId, email) => {
    if (!confirm(`Disconnect ${email}? Files uploaded to this drive won't be deleted.`)) return;
    try {
      await api.delete(`/drives/${driveId}`);
      toast.success(`${email} disconnected.`);
      fetchDrives();
    } catch {
      toast.error("Failed to disconnect drive.");
    }
  };

  const totalPercent = getUsagePercent(totalStorage.used, totalStorage.total);
  const card = isDark ? "glass-card-dark" : "glass-card-light";
  const textMain = isDark ? "text-white" : "text-gray-900";
  const textSub = isDark ? "text-white/30" : "text-gray-400";
  const textFaint = isDark ? "text-white/20" : "text-gray-300";
  const spinnerColor = isDark ? "text-purple-500" : "text-[#a78bfa]";
  const connectBtn = isDark ? "btn-glow-dark" : "btn-glow-light";
  const addBtn = isDark ? "bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30" : "bg-[#f0ebfe] border border-[#e9e0fd] text-[#8b5cf6] hover:bg-[#e9e0fd]";
  const barBg = isDark ? "storage-bar-dark" : "storage-bar-light";
  const barFill = isDark ? "storage-fill-dark" : "storage-fill-light";

  const statColors = isDark
    ? ["text-white", "text-yellow-400", "text-emerald-400"]
    : ["text-gray-900", "text-amber-500", "text-emerald-500"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/*Total storage summary*/}
      <div className={`${card} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-display text-xl font-semibold ${textMain}`}>Total Storage</h2>
          <button onClick={fetchDrives} className={`btn btn-ghost btn-xs gap-1 ${textSub}`}>
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className={`loading loading-spinner ${spinnerColor}`}></span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total", value: formatBytes(totalStorage.total), color: statColors[0] },
                { label: "Used", value: formatBytes(totalStorage.used), color: statColors[1] },
                { label: "Free", value: formatBytes(totalStorage.free), color: statColors[2] },
              ].map((s) => (
                <div key={s.label} className={`${card} p-4 text-center`}>
                  <div className={`font-mono text-2xl font-semibold tracking-tight ${s.color}`}>{s.value}</div>
                  <div className={`text-xs mt-1 font-body ${textSub}`}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className={`${barBg} mb-2`}>
              <div
                className={`${barFill}`}
                style={{ width: `${totalPercent}%` }}
              />
            </div>
            <div className={`flex justify-between text-xs font-mono ${textFaint}`}>
              <span>{totalPercent}% used</span>
              <span>{drives.length} drive{drives.length !== 1 ? "s" : ""} connected</span>
            </div>
          </>
        )}
      </div>

      {/*Per-drive breakdown*/}
      <div className={`${card} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-display text-xl font-semibold ${textMain}`}>Connected Drives</h2>
          <button onClick={onConnectDrive} className={`btn btn-sm gap-2 ${addBtn}`}>
            <PlusCircle size={14} />
            Add drive
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className={`loading loading-spinner ${spinnerColor}`}></span>
          </div>
        ) : drives.length === 0 ? (
          <div className="text-center py-12">
            <HardDrive size={40} className={`mx-auto mb-3 ${isDark ? "text-white/10" : "text-[#cab9fa]"}`} />
            <p className={`font-body ${textSub}`}>No drives connected yet</p>
            <button onClick={onConnectDrive} className={`${connectBtn} btn btn-sm mt-4 gap-2`}>
              <PlusCircle size={14} />
              Connect Google Drive
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {drives.map((drive) => {
              const percent = getUsagePercent(drive.quota?.used, drive.quota?.total);
              return (
                <div key={drive._id} className={`${card} p-4`}>
                  <div className="flex items-center gap-3 mb-3">
                    {drive.picture ? (
                      <img src={drive.picture} alt="" className="w-9 h-9 rounded-full border border-white/10" />
                    ) : (
                      <div className={
                        `w-9 h-9 rounded-full flex items-center justify-center ${isDark ?
                          "bg-gradient-to-br from-purple-600 to-violet-700" :
                          "bg-gradient-to-br from-[#b89ef8] to-[#cab9fa]"}`}>
                        <HardDrive size={16} className="text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium font-body truncate ${textMain}`}>
                        {drive.displayName || drive.email}
                      </p>
                      <p className={`text-xs font-body truncate ${textSub}`}>{drive.email}</p>
                    </div>
                    <button
                      onClick={() => handleDisconnect(drive._id, drive.email)}
                      className="btn btn-ghost btn-xs text-red-400/50 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {drive.quota?.error ? (
                    <p className="text-red-400/60 text-xs font-body">Failed to fetch quota</p>
                  ) : (
                    <>
                      <div className={`${barBg} mb-1.5`}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${percent >= 90 ?
                            "bg-gradient-to-r from-red-500 to-red-400" : percent >= 70 ?
                              "bg-gradient-to-r from-yellow-500 to-amber-400" : barFill
                            }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className={`flex justify-between text-xs font-mono ${textFaint}`}>
                        <span>{formatBytes(drive.quota?.used)} used</span>
                        <span>{formatBytes(drive.quota?.free)} free</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
