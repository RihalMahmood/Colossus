import { useState, useCallback } from "react";
import {
  FolderOpen, HardDrive, CloudUpload, Search, X, Loader,
  CloudOff, ChevronRight, Home, FolderPlus, Eye, ExternalLink,
  Download, Trash2, Compass, ArrowLeft,
} from "lucide-react";
import { glass, formatBytes, getFileIcon } from "../dashboard/dashboardUtils";
import { DeleteModal, CreateFolderModal } from "../dashboard/Modals";
import PreviewModal from "../dashboard/PreviewModals";
import UploadModal from "../dashboard/UploadModal";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function DriveExplorer({ drives }) {
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentFolderId = folderStack.length > 0
    ? folderStack[folderStack.length - 1].id
    : "root";

  const loadFolder = useCallback(async (driveId, folderId = "root") => {
    setLoading(true); setSearchResults(null); setSearchQuery("");
    try {
      const res = await api.get(`/drive-explorer/${driveId}/files`, { params: { folderId, pageSize: 100 } });
      setItems(res.data.items || []);
    } catch { toast.error("Failed to load folder"); }
    finally { setLoading(false); }
  }, []);

  const selectDrive = (drive) => {
    setSelectedDrive(drive); setFolderStack([]);
    loadFolder(drive._id, "root");
  };

  const openFolder = (item) => {
    setFolderStack(prev => [...prev, { id: item.id, name: item.name }]);
    loadFolder(selectedDrive._id, item.id);
  };

  const navigateTo = (index) => {
    const newStack = index < 0 ? [] : folderStack.slice(0, index + 1);
    setFolderStack(newStack);
    const folderId = newStack.length > 0 ? newStack[newStack.length - 1].id : "root";
    loadFolder(selectedDrive._id, folderId);
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const res = await api.get(`/drive-explorer/${selectedDrive._id}/search`, { params: { q: q.trim(), pageSize: 50 } });
      setSearchResults(res.data.items || []);
    } catch { toast.error("Search failed"); }
    finally { setSearching(false); }
  };

  const createFolder = async (name) => {
    setShowCreateFolder(false);
    try {
      await api.post(`/drive-explorer/${selectedDrive._id}/folders`, { name, parentId: currentFolderId });
      toast.success(`Folder "${name}" created`);
      loadFolder(selectedDrive._id, currentFolderId);
    } catch { toast.error("Failed to create folder"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/drive-explorer/${selectedDrive._id}/files/${deleteTarget.id}`);
      toast.success(`"${deleteTarget.name}" moved to trash`);
      setDeleteTarget(null);
      loadFolder(selectedDrive._id, currentFolderId);
    } catch { toast.error("Failed to delete"); }
  };

  const handleDownload = (item) => {
    const token = localStorage.getItem("colossus_token");
    const a = document.createElement("a");
    a.href = `/api/drive-explorer/${selectedDrive._id}/files/${item.id}/download?token=${token}`;
    a.download = item.name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const displayItems = searchResults !== null ? searchResults : items;

  //No drive selected
  if (!selectedDrive) {
    return (
      <div>
        <h2 className="font-mono text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
          <span className="w-8 h-0.5 bg-purple-400" />
          Drive Explorer
        </h2>
        {drives.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-mono text-xs uppercase tracking-widest">
            <HardDrive size={40} className="mx-auto mb-3 text-slate-700" />
            No drives connected.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drives.map(drive => (
              <button key={drive._id} onClick={() => selectDrive(drive)}
                className="p-5 rounded-xl border border-[#4a4454]/20 text-left hover:border-[#d1bcff]/30 hover:bg-[#d1bcff]/5 transition-all group"
                style={glass}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#d1bcff]/10 flex items-center justify-center">
                    <HardDrive size={18} className="text-[#d1bcff]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{drive.email}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{formatBytes(drive.quota?.free)} free</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono uppercase group-hover:text-[#d1bcff] transition-colors">
                  <Compass size={10} /> Browse files
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  //Drive browser
  return (
    <div>
      {/*Header*/}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedDrive(null)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors">
            <ArrowLeft size={14} /> All Drives
          </button>
          <span className="text-slate-700">/</span>
          <span className="text-xs font-mono text-[#d1bcff] font-bold uppercase">{selectedDrive.email.split("@")[0]}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4a4454]/30 text-slate-400 text-[10px] font-mono uppercase hover:border-[#d1bcff]/30 hover:text-[#d1bcff] transition-all">
            <FolderPlus size={12} /> New Folder
          </button>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d1bcff]/10 border border-[#d1bcff]/20 text-[#d1bcff] text-[10px] font-mono uppercase hover:bg-[#d1bcff]/20 transition-all">
            <CloudUpload size={12} /> Upload Here
          </button>
        </div>
      </div>

      {/*Breadcrumb*/}
      <div className="flex items-center gap-1 text-xs font-mono mb-4 flex-wrap">
        <button onClick={() => navigateTo(-1)}
          className="flex items-center gap-1 text-slate-500 hover:text-[#d1bcff] transition-colors">
          <Home size={12} /> Root
        </button>
        {folderStack.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight size={10} className="text-slate-700" />
            <button onClick={() => navigateTo(i)}
              className={`${i === folderStack.length - 1 ? "text-[#d1bcff]" : "text-slate-500 hover:text-[#d1bcff]"} transition-colors`}>
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/*Search*/}
      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search this drive..."
          className="w-full bg-[#0e0e0e] border border-[#4a4454]/20 rounded-xl py-2.5 pl-9 pr-4 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d1bcff]/30 transition-all" />
        {searching && <Loader size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d1bcff] animate-spin" />}
        {searchResults !== null && !searching && (
          <button onClick={() => { setSearchResults(null); setSearchQuery(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X size={13} />
          </button>
        )}
      </div>

      {/*Grid*/}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#201f1f] animate-pulse" />)}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-16">
          <CloudOff size={40} className="mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
            {searchResults !== null ? "No results found" : "This folder is empty"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {displayItems.map(item => {
            const { Icon: ItemIcon, color } = item.isFolder
              ? { Icon: FolderOpen, color: "text-[#d1bcff]" }
              : getFileIcon(item.name, item.mimeType);
            const isPreviewable = item.mimeType?.startsWith("image/") ||
              item.mimeType?.startsWith("video/") || item.mimeType?.startsWith("audio/") ||
              item.mimeType === "application/pdf";

            return (
              <div key={item.id}
                className="group relative rounded-xl border border-[#4a4454]/20 p-4 hover:border-[#d1bcff]/30 transition-all cursor-pointer"
                style={glass}
                onClick={() => item.isFolder && openFolder(item)}>
                {item.thumbnailLink && !item.isFolder ? (
                  <div className="w-full h-16 rounded-lg overflow-hidden mb-3 bg-[#201f1f]">
                    <img src={item.thumbnailLink} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-full h-16 rounded-lg mb-3 flex items-center justify-center bg-[#201f1f] ${color}`}>
                    <ItemIcon size={28} />
                  </div>
                )}
                <p className="text-xs font-semibold text-white truncate mb-1">{item.name}</p>
                <p className="text-[9px] text-slate-600 font-mono">
                  {item.isFolder ? "Folder" : (item.size ? formatBytes(item.size) : "—")}
                </p>

                {!item.isFolder && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPreviewable && (
                      <button onClick={(e) => { e.stopPropagation(); setPreviewFile(item); }}
                        className="p-1.5 rounded-lg bg-[#131313]/80 text-[#d1bcff] hover:bg-[#d1bcff]/20 transition-all" title="Preview">
                        <Eye size={12} />
                      </button>
                    )}
                    {item.webViewLink && (
                      <a href={item.webViewLink} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-[#131313]/80 text-slate-400 hover:bg-[#d1bcff]/20 hover:text-[#d1bcff] transition-all" title="Open in Drive">
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                      className="p-1.5 rounded-lg bg-[#131313]/80 text-slate-400 hover:bg-[#d1bcff]/20 hover:text-[#d1bcff] transition-all" title="Download">
                      <Download size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                      className="p-1.5 rounded-lg bg-[#131313]/80 text-red-400 hover:bg-red-500/20 transition-all" title="Move to trash">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateFolder && <CreateFolderModal onClose={() => setShowCreateFolder(false)} onConfirm={createFolder} />}
      {showUpload && (
        <UploadModal targetDriveId={selectedDrive._id} targetFolderId={currentFolderId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); loadFolder(selectedDrive._id, currentFolderId); }} />
      )}
      {previewFile && <PreviewModal file={previewFile} driveId={selectedDrive._id} onClose={() => setPreviewFile(null)} />}
      {deleteTarget && <DeleteModal fileName={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </div>
  );
}
