/*This component manages the user's connected Google Drive accounts, allowing them to connect new drives, 
view storage usage, and disconnect drives. It handles the OAuth flow for connecting drives and displays relevant 
information about each drive*/
import { useEffect, useState } from "react";
import { PlusCircle, HardDrive, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import api from "../../utils/api";
import { formatBytes, getUsagePercent } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

export default function DrivesPanel() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await api.get("/drives");
      setDrives(res.data.drives || []);
    } catch {
      toast.error("Failed to load drives.");
    } finally {
      setLoading(false);
    }
  };

  //Handle OAuth callback result from URL params
  useEffect(() => {
    const connected = searchParams.get("drive_connected");
    const error = searchParams.get("drive_error");
    const email = searchParams.get("email");

    if (connected === "true") {
      toast.success(`✅ Drive ${email ? `(${email}) ` : ""}connected successfully!`);
      setSearchParams({});
      fetchDrives();
    } else if (error) {
      const messages = {
        access_denied: "Drive connection was cancelled.",
        already_connected: `Drive ${email ? `(${email}) ` : ""}is already connected.`,
        user_not_found: "Session expired. Please log in again.",
        server_error: "Server error while connecting drive.",
      };
      toast.error(messages[error] || "Failed to connect drive.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleConnectDrive = async () => {
    setConnecting(true);
    try {
      const res = await api.get("/drives/connect");
      window.location.href = res.data.url;
    } catch {
      toast.error("Failed to generate connect URL.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async (driveId, email) => {
    if (!confirm(`Disconnect ${email}?\n\nNote: Files on this drive won't be deleted, but you won't be able to download chunked files that use this drive.`)) return;
    try {
      await api.delete(`/drives/${driveId}`);
      toast.success(`${email} disconnected.`);
      fetchDrives();
    } catch {
      toast.error("Failed to disconnect.");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/*Header*/}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Drive Accounts</h2>
          <p className="text-white/30 font-body text-sm mt-1">
            Each Google Drive adds 15 GB of free storage to your pool
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDrives} className="btn btn-ghost btn-sm text-white/30 hover:text-white gap-1">
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleConnectDrive}
            disabled={connecting}
            className="btn-glow btn btn-sm gap-2"
          >
            {connecting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <PlusCircle size={14} />
            )}
            Connect Google Drive
          </button>
        </div>
      </div>

      {/*Info banner*/}
      <div className="glass-card p-4 border border-cyan-500/20 bg-cyan-500/5">
        <div className="flex items-start gap-3">
          <CheckCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-cyan-300 text-sm font-body font-medium">How it works</p>
            <p className="text-white/40 text-xs font-body mt-0.5 leading-relaxed">
              Connect any number of Google accounts. COLOSSUS will automatically use the drive with 
              the most free space for uploads, and split large files across multiple drives when needed.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-purple-500"></span>
        </div>
      ) : drives.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HardDrive size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/30 font-body text-lg mb-2">No drives connected</p>
          <p className="text-white/20 font-body text-sm mb-6">
            Connect your first Google Drive to start using COLOSSUS
          </p>
          <button onClick={handleConnectDrive} disabled={connecting} className="btn-glow btn gap-2">
            {connecting ? <span className="loading loading-spinner loading-sm"></span> : <PlusCircle size={16} />}
            Connect Google Drive
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {drives.map((drive, idx) => {
            const percent = getUsagePercent(drive.quota?.used, drive.quota?.total);
            return (
              <div key={drive._id} className="glass-card p-5">
                <div className="flex items-center gap-4">
                  {/*Avatar*/}
                  {drive.picture ? (
                    <img
                      src={drive.picture}
                      alt=""
                      className="w-12 h-12 rounded-full border-2 border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shrink-0">
                      <HardDrive size={20} className="text-white" />
                    </div>
                  )}

                  {/*Info*/}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-body font-medium truncate">
                        {drive.displayName || drive.email}
                      </p>
                      <span className="badge badge-xs bg-purple-500/20 text-purple-300 border-0 font-mono">
                        Drive {idx + 1}
                      </span>
                    </div>
                    <p className="text-white/30 text-sm font-body truncate">{drive.email}</p>
                  </div>

                  {/*Quota summary*/}
                  {!drive.quota?.error && (
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="text-white font-mono text-sm font-semibold">
                        {formatBytes(drive.quota?.free)}
                      </p>
                      <p className="text-white/30 text-xs font-body">free</p>
                    </div>
                  )}

                  {/*Disconnect*/}
                  <button
                    onClick={() => handleDisconnect(drive._id, drive.email)}
                    className="btn btn-ghost btn-sm text-red-400/40 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/*Storage bar*/}
                <div className="mt-4">
                  {drive.quota?.error ? (
                    <div className="flex items-center gap-2 text-red-400/60 text-xs font-body">
                      <AlertCircle size={13} />
                      Failed to fetch quota — token may need refresh
                    </div>
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
                      <div className="flex justify-between text-xs font-mono text-white/25">
                        <span>{formatBytes(drive.quota?.used)} of {formatBytes(drive.quota?.total)} used</span>
                        <span>{percent}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
