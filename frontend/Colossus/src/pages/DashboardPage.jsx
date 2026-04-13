import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Database, HardDrive, CloudUpload, LogOut, Search,
  RefreshCw, Download, Trash2, CloudOff, Plus, Loader,
  FolderOpen, Compass, ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

import { glass, formatBytes, formatDate, getFileIcon, getInitials } from "../components/dashboard/dashboardUtils";
import DriveCard from "../components/dashboard/DriveCard";
import DriveExplorer from "../components/explorer/DriveExplorer";
import UploadModal from "../components/dashboard/UploadModal";
import { DeleteModal } from "../components/dashboard/Modals";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [drives, setDrives] = useState([]);
  const [totalStorage, setTotalStorage] = useState({ total: 0, used: 0, free: 0 });
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("files");
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [unifiedResults, setUnifiedResults] = useState(null);
  const [searchingDrives, setSearchingDrives] = useState(false);

  const sectionRefs = {
    files: useRef(null),
    storage: useRef(null),
    drives: useRef(null),
    explorer: useRef(null),
  };

  //Fetching

  const loadDrives = useCallback(async () => {
    setLoadingDrives(true);
    try {
      const res = await api.get("/drives");
      setDrives(res.data.drives || []);
      setTotalStorage(res.data.totalStorage || { total: 0, used: 0, free: 0 });
    } catch { toast.error("Failed to load drives"); }
    finally { setLoadingDrives(false); }
  }, []);

  const loadFiles = useCallback(async (q = "") => {
    setLoadingFiles(true);
    try {
      const res = await api.get("/files", { params: q ? { search: q } : {} });
      setFiles(res.data.files || []);
    } catch { toast.error("Failed to load files"); }
    finally { setLoadingFiles(false); }
  }, []);

  useEffect(() => { loadDrives(); loadFiles(); }, [loadDrives, loadFiles]);

  //OAuth callback
  useEffect(() => {
    const connected = searchParams.get("drive_connected");
    const error = searchParams.get("drive_error");
    const email = searchParams.get("email");
    if (connected === "true") { toast.success(`Drive ${email ? `(${email}) ` : ""}connected!`); loadDrives(); }
    else if (error) {
      const msgs = {
        access_denied: "Drive connection cancelled.",
        already_connected: `${email || "Drive"} already connected.`,
        csrf_mismatch: "Security check failed. Try again.",
        server_error: "Server error. Please try again.",
      };
      toast.error(msgs[error] || "Drive connection failed.");
    }
    if (connected || error) navigate("/dashboard", { replace: true });
  }, [searchParams, loadDrives, navigate]);

  //Unified search
  useEffect(() => {
    if (!search.trim()) {
      setUnifiedResults(null);
      const t = setTimeout(() => loadFiles(""), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      loadFiles(search);
      if (drives.length > 0) {
        setSearchingDrives(true);
        try {
          const results = await Promise.all(
            drives.map(async (drive) => {
              try {
                const res = await api.get(`/drive-explorer/${drive._id}/search`, { params: { q: search.trim(), pageSize: 20 } });
                return { driveEmail: drive.email, driveId: drive._id, items: res.data.items || [] };
              } catch { return { driveEmail: drive.email, driveId: drive._id, items: [] }; }
            })
          );
          setUnifiedResults(results.filter(r => r.items.length > 0));
        } catch { toast.error("Drive search failed"); }
        finally { setSearchingDrives(false); }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search, loadFiles, drives]);

  //Actions

  const handleConnectDrive = async () => {
    try { const res = await api.get("/drives/connect"); window.location.href = res.data.url; }
    catch { toast.error("Failed to initiate Drive connection."); }
  };

  const handleDisconnectDrive = async (driveId, email) => {
    if (!confirm(`Disconnect ${email}?\n\nFiles stored only on this drive may become inaccessible.`)) return;
    try { await api.delete(`/drives/${driveId}`); toast.success(`${email} disconnected.`); loadDrives(); }
    catch { toast.error("Failed to disconnect."); }
  };

  const handleDownload = (fileId, fileName) => {
    const token = localStorage.getItem("colossus_token");
    const a = document.createElement("a");
    a.href = `/api/files/${fileId}/download?token=${token}`;
    a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/files/${deleteTarget.id}`); toast.success("File deleted."); setDeleteTarget(null); loadFiles(search); loadDrives(); }
    catch { toast.error("Failed to delete file."); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDrives(), loadFiles(search)]);
    setRefreshing(false); toast.success("Refreshed.");
  };

  const scrollTo = (section) => {
    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const storagePct = totalStorage.total > 0 ? Math.round((totalStorage.used / totalStorage.total) * 100) : 0;

  const navItems = [
    { id: "files", Icon: FolderOpen, label: "My Files" },
    { id: "storage", Icon: Database, label: "Storage" },
    { id: "drives", Icon: HardDrive, label: "Drives" },
    { id: "explorer", Icon: Compass, label: "Explorer" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#131313] text-white">
      {/*Glows*/}
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#d1bcff]/8 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[30vw] h-[30vw] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/*SIDEBAR*/}
      <aside className="relative z-50 flex flex-col justify-between w-64 h-full py-8 px-4 flex-shrink-0 border-r border-[#4a4454]/20 bg-[#131313]">
        <div className="space-y-10">
          <div className="px-4">
            <h1 className="text-2xl font-black tracking-tighter text-[#d1bcff] uppercase font-mono">COLOSSUS</h1>
            <p className="text-[10px] tracking-[0.3em] text-slate-500 uppercase font-mono mt-0.5">Cloud Storage</p>
          </div>
          <nav className="space-y-1.5">
            {navItems.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-mono font-semibold uppercase tracking-wider
                  ${activeSection === id
                    ? "text-[#d1bcff] bg-[#353534]/50 border-l-4 border-[#d1bcff]"
                    : "text-slate-500 hover:text-[#d1bcff] hover:bg-[#201f1f] border-l-4 border-transparent"}`}>
                {label}
              </button>
            ))}
            <button onClick={() => setShowUpload(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-[#d1bcff] hover:bg-[#201f1f] transition-all text-sm font-mono font-semibold uppercase tracking-wider border-l-4 border-transparent">
              <CloudUpload size={18} /> Upload
            </button>
          </nav>
        </div>
        <div className="px-2">
          <div className="flex items-center gap-3 p-3 bg-[#201f1f] rounded-xl border border-[#4a4454]/20 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#d1bcff]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#d1bcff] font-mono">{getInitials(user?.name)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-500 font-mono uppercase truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-xs font-mono font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/*MAIN*/}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <header className="flex items-center justify-between px-10 h-20 flex-shrink-0 border-b border-[#4a4454]/20 bg-[#131313]/80 backdrop-blur-xl">
          <div className="relative flex-1 max-w-xl">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH ALL DRIVES..."
              className="w-full bg-[#0e0e0e] border border-[#4a4454]/20 rounded-xl py-2.5 pl-11 pr-4 text-xs font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d1bcff]/30 transition-all uppercase" />
          </div>
          <div className="flex items-center gap-6 ml-6">
            <button onClick={handleRefresh} className="text-slate-500 hover:text-[#d1bcff] transition-colors">
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>
            <div className="h-6 w-px bg-[#4a4454]/30" />
            <span className="text-lg font-black tracking-widest text-[#d1bcff] uppercase font-mono">COLOSSUS</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-10 py-10 space-y-20"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#353534 transparent" }}>

          {/*UNIFIED SEARCH RESULTS*/}
          {search.trim() && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="font-mono text-lg font-bold uppercase tracking-widest flex items-center gap-3">
                  <span className="w-8 h-0.5 bg-amber-400" />
                  Search Results
                  <span className="text-xs text-slate-600 normal-case tracking-normal font-normal">— across all drives for "{search}"</span>
                </h2>
                {searchingDrives && <Loader size={14} className="animate-spin text-[#d1bcff]" />}
              </div>
              {unifiedResults !== null && (
                unifiedResults.length === 0 ? (
                  <p className="text-slate-600 text-xs font-mono uppercase tracking-widest mb-6">No matching files found in connected drives</p>
                ) : (
                  <div className="space-y-6 mb-6">
                    {unifiedResults.map(({ driveEmail, driveId, items }) => (
                      <div key={driveId}>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <HardDrive size={11} className="text-[#d1bcff]" />
                          {driveEmail}
                          <span className="text-slate-700">— {items.length} result{items.length !== 1 ? "s" : ""}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {items.map(item => {
                            const { Icon: ResultIcon, color } = item.isFolder
                              ? { Icon: FolderOpen, color: "text-[#d1bcff]" }
                              : getFileIcon(item.name, item.mimeType);
                            return (
                              <div key={item.id}
                                className="group relative rounded-xl border border-[#4a4454]/20 p-4 hover:border-[#d1bcff]/30 transition-all"
                                style={glass}>
                                {item.thumbnailLink ? (
                                  <div className="w-full h-14 rounded-lg overflow-hidden mb-3 bg-[#201f1f]">
                                    <img src={item.thumbnailLink} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className={`w-full h-14 rounded-lg mb-3 flex items-center justify-center bg-[#201f1f] ${color}`}>
                                    <ResultIcon size={22} />
                                  </div>
                                )}
                                <p className="text-xs font-semibold text-white truncate mb-1">{item.name}</p>
                                <p className="text-[9px] text-slate-600 font-mono">{item.size ? formatBytes(item.size) : item.isFolder ? "Folder" : "—"}</p>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.webViewLink && (
                                    <a href={item.webViewLink} target="_blank" rel="noreferrer"
                                      className="p-1.5 rounded-lg bg-[#131313]/80 text-[#d1bcff] hover:bg-[#d1bcff]/20 transition-all" title="Open in Drive">
                                      <ExternalLink size={11} />
                                    </a>
                                  )}
                                  <button onClick={() => {
                                    const token = localStorage.getItem("colossus_token");
                                    const a = document.createElement("a");
                                    a.href = `/api/drive-explorer/${driveId}/files/${item.id}/download?token=${token}`;
                                    a.download = item.name;
                                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                  }} className="p-1.5 rounded-lg bg-[#131313]/80 text-slate-400 hover:bg-[#d1bcff]/20 hover:text-[#d1bcff] transition-all" title="Download">
                                    <Download size={11} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">↓ Colossus-managed file results shown in My Files section below</p>
            </section>
          )}

          {/*STORAGE*/}
          <section ref={sectionRefs.storage}>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-mono text-2xl font-bold uppercase tracking-tight mb-1">System Capacity</h2>
                <p className="text-slate-500 text-sm">Aggregated storage across all connected drives</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[#d1bcff] text-2xl font-bold">{formatBytes(totalStorage.used)} / {formatBytes(totalStorage.total)}</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-mono">Utilization Index</p>
              </div>
            </div>
            <div className="relative h-5 bg-[#201f1f] rounded-full overflow-hidden mb-10">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#d1bcff] to-[#a277ff] shadow-[0_0_25px_rgba(209,188,255,0.4)] flex items-center justify-end px-3 transition-all duration-700"
                style={{ width: `${storagePct}%` }}>
                {storagePct > 5 && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { label: "Total Storage", value: formatBytes(totalStorage.total), tag: "TOTAL_CAPACITY", color: "text-[#d1bcff]" },
                { label: "Used Space", value: formatBytes(totalStorage.used), tag: "ALLOCATED_BITS", color: "text-emerald-400" },
                { label: "Free Space", value: formatBytes(totalStorage.free), tag: "FREE_VOIDS", color: "text-amber-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-[#4a4454]/20 p-6 hover:border-[#d1bcff]/20 transition-all" style={glass}>
                  <div className="flex items-start justify-between mb-4">
                    <Database size={18} className={s.color} />
                    <span className="font-mono text-[10px] text-slate-600">{s.tag}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">{s.label}</p>
                  {loadingDrives
                    ? <div className="h-8 w-24 bg-[#353534] rounded animate-pulse" />
                    : <h3 className="text-2xl font-bold font-mono text-white">{s.value}</h3>}
                </div>
              ))}
            </div>
          </section>

          {/*DRIVES*/}
          <section ref={sectionRefs.drives}>
            <h2 className="font-mono text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-[#d1bcff]" /> Connected Nodes
            </h2>
            {loadingDrives ? (
              <div className="flex gap-5">{[1, 2].map(i => <div key={i} className="min-w-[300px] h-44 rounded-xl bg-[#201f1f] animate-pulse" />)}</div>
            ) : (
              <div className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#353534 transparent" }}>
                {drives.map(drive => <DriveCard key={drive._id} drive={drive} onDisconnect={handleDisconnectDrive} />)}
                <button onClick={handleConnectDrive}
                  className="min-w-[300px] flex-shrink-0 border-2 border-dashed border-[#4a4454]/30 rounded-xl flex flex-col items-center justify-center gap-4 py-12 hover:border-[#d1bcff]/40 hover:bg-[#d1bcff]/5 transition-all group">
                  <div className="w-12 h-12 rounded-full border border-[#4a4454]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={20} className="text-slate-500 group-hover:text-[#d1bcff] transition-colors" />
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Connect Drive</span>
                </button>
              </div>
            )}
          </section>

          {/*MY FILES*/}
          <section ref={sectionRefs.files}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-mono text-lg font-bold uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-0.5 bg-emerald-400" />
                My Files
                <span className="text-xs text-slate-600 normal-case tracking-normal font-normal">— uploaded via Colossus</span>
              </h2>
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d1bcff]/10 border border-[#d1bcff]/20 text-[#d1bcff] text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#d1bcff]/20 transition-all">
                <Plus size={14} /> Upload File
              </button>
            </div>
            <div className="rounded-xl border border-[#4a4454]/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)]" style={glass}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#4a4454]/10 bg-[#1c1b1b]/50">
                    {["Fragment Name", "Magnitude", "Origin Node", "Temporal Marker", ""].map((h, i) => (
                      <th key={i} className={`px-6 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 ${i === 4 ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingFiles ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-mono uppercase tracking-widest">
                        <Loader size={16} className="animate-spin text-[#d1bcff]" /> Loading fragments...
                      </div>
                    </td></tr>
                  ) : files.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-16 text-center">
                      <CloudOff size={40} className="mx-auto mb-3 text-slate-700" />
                      <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">No data fragments found</p>
                      <p className="text-slate-700 text-xs mt-1">Upload a file to get started</p>
                    </td></tr>
                  ) : (
                    files.map(file => {
                      const { Icon: FileIcon, color } = getFileIcon(file.name, file.mimeType);
                      return (
                        <tr key={file._id} className="group hover:bg-[#d1bcff]/5 transition-colors border-b border-[#4a4454]/10 last:border-0">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#201f1f] flex items-center justify-center flex-shrink-0">
                                <FileIcon size={16} className={color} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate max-w-[200px]">{file.name}</p>
                                <p className="text-[9px] font-mono text-slate-600 uppercase">{file.mimeType || "Unknown"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatBytes(file.totalSize)}</td>
                          <td className="px-6 py-4">
                            {file.isChunked
                              ? <span className="px-2 py-1 rounded bg-amber-400/10 text-amber-400 text-[9px] font-mono font-bold uppercase">Chunked ({file.chunks?.length || 0})</span>
                              : <span className="px-2 py-1 rounded bg-[#d1bcff]/10 text-[#d1bcff] text-[9px] font-mono font-bold uppercase">{file.singleDriveAccountEmail || "Drive"}</span>}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatDate(file.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleDownload(file._id, file.name)}
                                className="p-2 rounded-lg hover:bg-[#201f1f] text-[#d1bcff] transition-colors" title="Download">
                                <Download size={14} />
                              </button>
                              <button onClick={() => setDeleteTarget({ id: file._id, name: file.name })}
                                className="p-2 rounded-lg hover:bg-[#201f1f] text-red-400 transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {files.length > 0 && (
              <p className="text-[10px] font-mono text-slate-600 mt-3 uppercase tracking-widest text-right">
                {files.length} fragment{files.length !== 1 ? "s" : ""} indexed
              </p>
            )}
          </section>

          {/*EXPLORER*/}
          <section ref={sectionRefs.explorer}>
            <DriveExplorer drives={drives} />
          </section>

          <div className="h-8" />
        </main>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { loadFiles(search); loadDrives(); }} />}
      {deleteTarget && <DeleteModal fileName={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </div>
  );
}
