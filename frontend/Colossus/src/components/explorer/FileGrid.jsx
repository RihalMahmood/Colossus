import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search, FolderPlus, Zap, FolderInput, ChevronRight, FolderOpen,
  Download, Trash2, Eye, Loader, FileX, MoreVertical,
  HardDrive, ChevronDown
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { formatBytes, formatDate, getFileTypeInfo } from "../../utils/helpers";
import UploadZone from "../files/UploadZone";

//Create Folder Modal

function CreateFolderModal({ onConfirm, onClose, isDark }) {
  const [name, setName] = useState("");
  const inputClass = isDark
    ? "input w-full bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-500/50"
    : "input w-full bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#cab9fa]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-80 rounded-2xl p-6 ${isDark
        ? "bg-[#1a1a25] border border-white/10"
        : "bg-white border border-gray-200"}`}>
        <h3 className={`font-display font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
          New Folder
        </h3>
        <input
          autoFocus type="text" placeholder="Folder name"
          className={inputClass} value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
            if (e.key === "Escape") onClose();
          }}
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className={`btn btn-sm flex-1 ${isDark
            ? "bg-white/5 border-white/10 text-white/60"
            : "bg-gray-100 border-gray-200 text-gray-500"}`}>
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            className={`btn btn-sm flex-1 ${isDark
              ? "bg-purple-600 text-white border-0 hover:bg-purple-500"
              : "bg-[#cab9fa] text-[#121212] border-0 hover:bg-[#b89ef8]"}`}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

//Portal Context Menu

/*
Renders the context menu via React Portal at document.body level.
This means it is never clipped by any parent's overflow:hidden — the root
cause of the menu being cut off inside the file card.

Position is calculated from the trigger button's bounding rect so the menu
always appears directly below the ⋮ button regardless of scroll position.
*/
function ContextMenu({ anchorRef, onClose, children, isDark }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  //Calculate position from the anchor button on mount
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const viewportWidth = window.innerWidth;

    //Flip left if near right edge
    const left = rect.right + menuWidth > viewportWidth
      ? rect.right - menuWidth
      : rect.left;

    setPos({ top: rect.bottom + 6, left });
  }, [anchorRef]);

  //Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, anchorRef]);

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, minWidth: 160 }}
      className={`rounded-xl shadow-2xl border py-1 ${isDark
        ? "bg-[#1a1a25] border-white/10"
        : "bg-white border-gray-200"}`}
    >
      {children}
    </div>,
    document.body
  );
}

//File Item Card

function FileItem({ file, isDark, onNavigate, onPreview, onDownload, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const typeInfo = getFileTypeInfo(file.mimeType, file.name);
  const isFolder = file.isFolder;

  const cardClass = isDark
    ? "glass-card-dark p-3 group cursor-pointer hover:border-purple-500/30"
    : "glass-card-light p-3 group cursor-pointer hover:border-[#cab9fa]";

  const handleClick = () => {
    if (isFolder) onNavigate(file);
    else if (!file.isGoogleDoc) onPreview(file);
  };

  const menuItemClass = (danger = false) =>
    danger
      ? "flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
      : `flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${isDark
          ? "hover:bg-white/5 text-white/70 hover:text-white"
          : "hover:bg-gray-100 text-gray-700"}`;

  return (
    <div className={`${cardClass} relative`} onClick={handleClick}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl select-none">
          {isFolder
            ? <FolderOpen size={28} className={isDark ? "text-purple-400" : "text-[#a78bfa]"} />
            : <span>{typeInfo.icon}</span>}
        </div>

        {/*button — ref is used by ContextMenu to calculate position*/}
        <button
          ref={menuBtnRef}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all ${isDark
            ? "hover:bg-white/10 text-white/40 hover:text-white"
            : "hover:bg-gray-200 text-gray-400 hover:text-gray-900"}`}>
          <MoreVertical size={14} />
        </button>
      </div>

      {/*Portal context menu — rendered at body level, never clipped*/}
      {menuOpen && (
        <ContextMenu anchorRef={menuBtnRef} onClose={() => setMenuOpen(false)} isDark={isDark}>
          {!isFolder && !file.isGoogleDoc && (
            <button onClick={() => { onPreview(file); setMenuOpen(false); }} className={menuItemClass()}>
              <Eye size={13} /> Preview
            </button>
          )}
          {file.isGoogleDoc && (
            <a href={file.webViewLink} target="_blank" rel="noreferrer"
              onClick={() => setMenuOpen(false)} className={menuItemClass()}>
              <Eye size={13} /> Open in Google
            </a>
          )}
          {!isFolder && (
            <button onClick={() => { onDownload(file.id, file.name, file); setMenuOpen(false); }} className={menuItemClass()}>
              <Download size={13} /> Download
            </button>
          )}
          <button onClick={() => { onDelete(file.id, file.name, file); setMenuOpen(false); }} className={menuItemClass(true)}>
            <Trash2 size={13} /> Delete
          </button>
        </ContextMenu>
      )}

      <p className={`text-xs font-body font-medium truncate mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
        title={file.name}>
        {file.name}
      </p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-mono ${isDark ? "text-white/20" : "text-gray-300"}`}>
          {file.size ? formatBytes(file.size) : isFolder ? "Folder" : "—"}
        </span>
        <span className={`text-xs font-body ${isDark ? "text-white/20" : "text-gray-300"}`}>
          {formatDate(file.modifiedTime)}
        </span>
      </div>
    </div>
  );
}

//Drive Section (search results grouped by drive)

function DriveSection({ email, files, isDark, defaultOpen, onNavigate, onPreview, onDownload, onDelete }) {
  const [open, setOpen] = useState(defaultOpen);
  const folders = files.filter((f) => f.isFolder);
  const regularFiles = files.filter((f) => !f.isFolder);
  const count = files.length;

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all ${isDark
      ? "border-white/8 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50"}`}>

      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${isDark
          ? "hover:bg-white/5" : "hover:bg-gray-100/80"}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isDark
          ? "bg-purple-500/20" : "bg-[#f0ebfe]"}`}>
          <HardDrive size={13} className={isDark ? "text-purple-400" : "text-[#8b5cf6]"} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span className={`text-sm font-body font-medium truncate block ${isDark ? "text-white/80" : "text-gray-700"}`}>
            {email}
          </span>
        </div>
        <span className={`shrink-0 text-xs font-mono px-2 py-0.5 rounded-full ${isDark
          ? "bg-purple-500/20 text-purple-300" : "bg-[#f0ebfe] text-[#8b5cf6]"}`}>
          {count} {count === 1 ? "result" : "results"}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${isDark ? "text-white/30" : "text-gray-400"}
            ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <div className={`px-4 pb-4 pt-1 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
          {folders.length > 0 && (
            <div className="mb-3">
              <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${isDark ? "text-white/20" : "text-gray-300"}`}>
                Folders ({folders.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {folders.map((f) => (
                  <FileItem key={`${f._driveId}:${f.id}`} file={f} isDark={isDark}
                    onNavigate={onNavigate} onPreview={onPreview}
                    onDownload={onDownload} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
          {regularFiles.length > 0 && (
            <div>
              {folders.length > 0 && (
                <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${isDark ? "text-white/20" : "text-gray-300"}`}>
                  Files ({regularFiles.length})
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {regularFiles.map((f) => (
                  <FileItem key={`${f._driveId}:${f.id}`} file={f} isDark={isDark}
                    onNavigate={onNavigate} onPreview={onPreview}
                    onDownload={onDownload} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

//Main FileGrid

export default function FileGrid({
  files, loading, breadcrumbs, search, selectedDrive, currentFolderId,
  nextPageToken, onSearchChange, onNavigateFolder, onBreadcrumbClick,
  onPreview, onDownload, onDelete, onCreateFolder, onLoadMore, onUploadComplete,
  driveId,
}) {
  const { isDark } = useTheme();
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const [showDirectUpload, setShowDirectUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const handleCreateFolder = async (name) => {
    setShowCreateFolder(false);
    await onCreateFolder(name);
  };

  const folderLabel = selectedDrive
    ? [selectedDrive.email, ...breadcrumbs.slice(1).map((b) => b.name)].join(" / ")
    : "current folder";

  const isSearchMode = !!search.trim();

  const driveGroups = isSearchMode
    ? files.reduce((acc, file) => {
        const key = file._driveEmail || "Unknown Drive";
        if (!acc[key]) acc[key] = [];
        acc[key].push(file);
        return acc;
      }, {})
    : null;

  const driveGroupEntries = driveGroups ? Object.entries(driveGroups) : [];
  const autoExpand = driveGroupEntries.length <= 2;

  const topBarBorder = isDark ? "border-b border-white/5" : "border-b border-gray-100";
  const accentText = isDark ? "text-purple-400" : "text-[#a78bfa]";
  const mutedText = isDark ? "text-white/30" : "text-gray-400";
  const mainText = isDark ? "text-white" : "text-gray-900";
  const btnSecondary = isDark
    ? "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-purple-500/50 hover:bg-white/10"
    : "bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-[#cab9fa] hover:bg-gray-200";
  const btnSmartActive = isDark
    ? "bg-purple-600 text-white border-0 hover:bg-purple-500"
    : "bg-[#cab9fa] text-gray-900 border-0 hover:bg-[#b89ef8]";

  const folders = files.filter((f) => f.isFolder);
  const regularFiles = files.filter((f) => !f.isFolder);

  return (
    <div className="flex flex-col h-full">

      {/*Top toolbar*/}
      <div className={`px-4 py-3 flex items-center gap-3 ${topBarBorder}`}>
        <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
          {!search.trim() && breadcrumbs.map((crumb, idx) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight size={13} className={mutedText} />}
              <button
                onClick={() => onBreadcrumbClick(crumb, idx)}
                className={`text-sm font-body transition-colors ${idx === breadcrumbs.length - 1
                  ? mainText + " font-medium"
                  : mutedText + " hover:text-white"}`}>
                {crumb.name}
              </button>
            </span>
          ))}
          {search.trim() && (
            <span className={`text-sm font-body ${mutedText}`}>
              Search results for <span className={accentText}>"{search}"</span>
              {driveGroupEntries.length > 0 && (
                <span className={`ml-2 text-xs font-mono ${isDark ? "text-white/15" : "text-gray-300"}`}>
                  — {driveGroupEntries.length} {driveGroupEntries.length === 1 ? "drive" : "drives"}
                </span>
              )}
            </span>
          )}
        </div>

        <div className="relative">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`} />
          <input
            type="text" placeholder="Search all drives"
            value={search} onChange={(e) => onSearchChange(e.target.value)}
            className={`pl-9 pr-3 py-1.5 text-sm rounded-xl border w-44 focus:outline-none ${isDark
              ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-purple-500/40"
              : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#cab9fa]"}`}
          />
        </div>

        {selectedDrive && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreateFolder(true)}
              className={`btn btn-xs gap-1 ${btnSecondary}`}>
              <FolderPlus size={13} /> New folder
            </button>
            <button
              onClick={() => { setShowSmartUpload((v) => !v); setShowDirectUpload(false); }}
              className={`btn btn-xs gap-1 ${showSmartUpload ? btnSmartActive : btnSecondary}`}
              title="Smart Upload — auto-picks the drive with most free space">
              <Zap size={13} /> Smart Upload
            </button>
          </div>
        )}
      </div>

      {/*Smart Upload zone*/}
      {showSmartUpload && (
        <div className="px-4 pt-3 animate-slide-up">
          <UploadZone
            mode="smart"
            onUploaded={(f) => { if (f) setShowSmartUpload(false); }}
          />
        </div>
      )}

      {/*File grid*/}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size={28} className={`animate-spin ${isDark ? "text-purple-400" : "text-[#a78bfa]"}`} />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20">
            <FileX size={40} className={`mx-auto mb-3 ${isDark ? "text-white/10" : "text-gray-200"}`} />
            <p className={`font-body ${mutedText}`}>
              {search ? "No results found across any drive" : "This folder is empty"}
            </p>
          </div>
        ) : isSearchMode ? (
          <div className="space-y-3">
            {driveGroupEntries.map(([email, driveFiles]) => (
              <DriveSection
                key={email} email={email} files={driveFiles}
                isDark={isDark} defaultOpen={autoExpand}
                onNavigate={onNavigateFolder} onPreview={onPreview}
                onDownload={onDownload} onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {folders.length > 0 && (
              <div>
                <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${mutedText}`}>
                  Folders ({folders.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {folders.map((f) => (
                    <FileItem key={f.id} file={f} isDark={isDark}
                      onNavigate={onNavigateFolder} onPreview={onPreview}
                      onDownload={onDownload} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            )}
            {regularFiles.length > 0 && (
              <div>
                <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${mutedText}`}>
                  Files ({regularFiles.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {regularFiles.map((f) => (
                    <FileItem key={`${f._driveId || ""}:${f.id}`} file={f} isDark={isDark}
                      onNavigate={onNavigateFolder} onPreview={onPreview}
                      onDownload={onDownload} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            )}
            {nextPageToken && (
              <div className="flex justify-center pt-4">
                <button onClick={onLoadMore} className={`btn btn-sm gap-2 ${isDark
                  ? "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  : "bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900"}`}>
                  Load more
                </button>
              </div>
            )}
          </div>
        )}

        {/*Upload Here zone*/}
        {selectedDrive && !search.trim() && (
          <div className="mt-6 pt-4 border-t border-dashed border-white/5">
            <button
              onClick={() => { setShowDirectUpload((v) => !v); setShowSmartUpload(false); }}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-body
                transition-all duration-150 border border-dashed mb-3
                ${showDirectUpload
                  ? isDark
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                    : "border-[#b89ef8] bg-[#f0ebfe] text-[#8b5cf6]"
                  : isDark
                  ? "border-white/10 text-white/20 hover:text-white/40 hover:border-white/20"
                  : "border-gray-200 text-gray-300 hover:text-gray-500 hover:border-gray-300"}`}>
              <FolderInput size={13} />
              {showDirectUpload ? "Hide" : "Upload to this folder"}
              {!showDirectUpload && (
                <span className={`font-mono ml-1 ${isDark ? "text-white/15" : "text-gray-300"}`}>
                  — {folderLabel}
                </span>
              )}
            </button>
            {showDirectUpload && (
              <div className="animate-slide-up">
                <UploadZone
                  mode="direct" driveId={driveId}
                  folderId={currentFolderId} folderLabel={folderLabel}
                  onUploaded={() => { onUploadComplete(); setShowDirectUpload(false); }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateFolder && (
        <CreateFolderModal
          onConfirm={handleCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
