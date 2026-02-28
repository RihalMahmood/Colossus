/*This component provides a dashboard for users to manage their connected Google Drive accounts, 
view total storage usage, and disconnect drives. It fetches drive data from the backend and displays it in 
an organized manner, allowing users to easily see how much storage they have available and which drives are connected*/
import { useEffect, useState } from "react";
import { HardDrive, RefreshCw, Trash2, PlusCircle } from "lucide-react";
import api from "../../utils/api";
import { formatBytes, getUsagePercent } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function StoragePanel({ onConnectDrive }) {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/*Total storage summary*/}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-white">Total Storage</h2>
          <button onClick={fetchDrives} className="btn btn-ghost btn-xs text-white/40 hover:text-white gap-1">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner text-purple-500"></span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total", value: formatBytes(totalStorage.total), color: "text-white" },
                { label: "Used", value: formatBytes(totalStorage.used), color: "text-yellow-400" },
                { label: "Free", value: formatBytes(totalStorage.free), color: "text-emerald-400" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-4 text-center">
                  <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-white/40 text-xs mt-1 font-body">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="storage-bar mb-2">
              <div
                className="storage-fill"
                style={{ width: `${totalPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/30 font-mono">
              <span>{totalPercent}% used</span>
              <span>{drives.length} drive{drives.length !== 1 ? "s" : ""} connected</span>
            </div>
          </>
        )}
      </div>

      {/*Per-drive breakdown*/}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-white">Connected Drives</h2>
          <button onClick={onConnectDrive} className="btn btn-sm bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 gap-2">
            <PlusCircle size={14} />
            Add drive
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner text-purple-500"></span>
          </div>
        ) : drives.length === 0 ? (
          <div className="text-center py-12">
            <HardDrive size={40} className="mx-auto text-white/10 mb-3" />
            <p className="text-white/30 font-body">No drives connected yet</p>
            <button onClick={onConnectDrive} className="btn-glow btn btn-sm mt-4 gap-2">
              <PlusCircle size={14} />
              Connect Google Drive
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {drives.map((drive) => {
              const percent = getUsagePercent(drive.quota?.used, drive.quota?.total);
              return (
                <div key={drive._id} className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {drive.picture ? (
                      <img src={drive.picture} alt="" className="w-9 h-9 rounded-full border border-white/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center">
                        <HardDrive size={16} className="text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium font-body truncate">
                        {drive.displayName || drive.email}
                      </p>
                      <p className="text-white/30 text-xs font-body truncate">{drive.email}</p>
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
                      <div className="storage-bar mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            percent >= 90
                              ? "bg-gradient-to-r from-red-500 to-red-400"
                              : percent >= 70
                              ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                              : "storage-fill"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/30 font-mono">
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
