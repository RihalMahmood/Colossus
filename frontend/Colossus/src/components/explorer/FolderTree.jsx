import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, HardDrive, Loader } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";

function FolderNode({ driveId, folder, depth, selectedFolderId, onNavigate, driveObj }) {
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isSelected = selectedFolderId === folder.id;

  const handleExpand = async (e) => {
    e.stopPropagation();
    if (!expanded && !loaded) {
      setLoading(true);
      try {
        const res = await api.get(`/drive-explorer/${driveId}/files`, {
          params: { folderId: folder.id, pageSize: 50 },
        });
        setChildren((res.data.items || []).filter((f) => f.isFolder));
        setLoaded(true);
      } catch {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((prev) => !prev);
  };

  const activeClass = isDark
    ? "bg-purple-600/20 text-white border-l-2 border-purple-500"
    : "bg-[#f0ebfe] text-gray-900 border-l-2 border-[#cab9fa]";
  const hoverClass = isDark
    ? "hover:bg-white/5 text-white/60 hover:text-white"
    : "hover:bg-gray-100 text-gray-500 hover:text-gray-900";

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg cursor-pointer transition-all text-sm font-body select-none 
            ${isSelected ? activeClass : hoverClass}
            `}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        onClick={() => onNavigate(folder.id, folder.name, driveObj)}
      >
        <button onClick={handleExpand} className="shrink-0 w-4 h-4 flex items-center justify-center">
          {loading ? <Loader size={12} className="animate-spin" /> : expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {expanded
          ? <FolderOpen size={14} className={isDark ? "text-purple-400 shrink-0" : "text-[#a78bfa] shrink-0"} />
          : <Folder size={14} className={isDark ? "text-purple-400/70 shrink-0" : "text-[#c4b5fd] shrink-0"} />
        }
        <span className="truncate">{folder.name}</span>
      </div>
      {expanded && children.map((child) => (
        <FolderNode key={child.id} driveId={driveId} folder={child} depth={depth + 1}
          selectedFolderId={selectedFolderId} onNavigate={onNavigate} driveObj={driveObj} />
      ))}
    </div>
  );
}

export default function FolderTree({ drives, loading, selectedDrive, currentFolderId, onNavigate }) {
  const { isDark } = useTheme();
  const [expandedDrives, setExpandedDrives] = useState({});
  const [driveFolders, setDriveFolders] = useState({});
  const [loadingDrive, setLoadingDrive] = useState({});

  const toggleDrive = async (drive) => {
    const id = drive._id;
    if (!expandedDrives[id] && !driveFolders[id]) {
      setLoadingDrive((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await api.get(`/drive-explorer/${id}/files`, { params: { folderId: "root", pageSize: 50 } });
        setDriveFolders((prev) => ({ ...prev, [id]: (res.data.items || []).filter((f) => f.isFolder) }));
      } catch {
        setDriveFolders((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setLoadingDrive((prev) => ({ ...prev, [id]: false }));
      }
    }
    setExpandedDrives((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const driveActiveClass = isDark ? "bg-white/5 text-white" : "bg-gray-100 text-gray-900";
  const driveHoverClass = isDark ? "hover:bg-white/5 text-white/50 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900";
  const rootActiveClass = isDark ? "bg-purple-600/20 text-white border-l-2 border-purple-500" : "bg-[#f0ebfe] text-gray-900 border-l-2 border-[#cab9fa]";
  const rootHoverClass = isDark ? "hover:bg-white/5 text-white/50 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900";

  return (
    <div className="p-3 space-y-1">
      <p className={`px-2 pb-2 text-xs font-mono uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>
        Connected Drives
      </p>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader size={18} className={`animate-spin ${isDark ? "text-purple-400" : "text-[#a78bfa]"}`} />
        </div>
      ) : drives.length === 0 ? (
        <p className={`text-xs px-2 ${isDark ? "text-white/20" : "text-gray-300"}`}>No drives connected</p>
      ) : drives.map((drive) => {
        const isExpanded = expandedDrives[drive._id];
        const isSelected = selectedDrive?._id === drive._id;
        const isRootSelected = isSelected && currentFolderId === "root";
        const folders = driveFolders[drive._id] || [];

        return (
          <div key={drive._id}>
            <div
              className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all text-sm font-body 
                ${isSelected ? driveActiveClass : driveHoverClass}`
              }
              onClick={() => { onNavigate("root", "My Drive", drive); toggleDrive(drive); }}
            >
              {drive.picture
                ? <img src={drive.picture} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full shrink-0" />
                : <HardDrive size={14} className="shrink-0" />
              }
              <span className="truncate text-xs font-medium">{drive.email}</span>
              <div className="ml-auto shrink-0">
                {loadingDrive[drive._id] ? <Loader size={11} className="animate-spin" />
                  : isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </div>
            </div>

            {isExpanded && (
              <div>
                <div
                  className={`flex items-center gap-2 py-1.5 pr-2 rounded-lg cursor-pointer transition-all text-xs font-body 
                    ${isRootSelected ? rootActiveClass : rootHoverClass}`
                  }
                  style={{ paddingLeft: "24px" }}
                  onClick={() => onNavigate("root", "My Drive", drive)}
                >
                  <FolderOpen size={13} className={isDark ? "text-purple-400/70" : "text-[#c4b5fd]"} />
                  <span>My Drive</span>
                </div>
                {folders.map((folder) => (
                  <FolderNode key={folder.id} driveId={drive._id} folder={folder} depth={1}
                    selectedFolderId={currentFolderId} onNavigate={onNavigate} driveObj={drive} />
                ))}
                {folders.length === 0 && !loadingDrive[drive._id] && (
                  <p className={`text-xs pl-8 py-1 ${isDark ? "text-white/20" : "text-gray-300"}`}>No folders</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
