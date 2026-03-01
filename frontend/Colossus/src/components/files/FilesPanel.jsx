import { useEffect, useState, useCallback } from "react";
import { Search, Upload, Grid, List, FileX, Filter } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import FileCard from "./FileCard";
import UploadZone from "./UploadZone";
import toast from "react-hot-toast";

export default function FilesPanel() {
  const { isDark } = useTheme();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState("grid");     //grid | list

  const fetchFiles = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await api.get("/files", { params: q ? { search: q } : {} });
      setFiles(res.data.files || []);
    } catch {
      toast.error("Failed to load files.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  //Debounced search. Waits for 350ms of inactivity before triggering the search, to avoid excessive API calls while typing.
  useEffect(() => {
    const timer = setTimeout(() => fetchFiles(search), 350);
    return () => clearTimeout(timer);
  }, [search, fetchFiles]);

  const handleFileDeleted = (fileId) => {
    setFiles((prev) => prev.filter((f) => f._id !== fileId));
  };

  const handleUploaded = (newFile) => {
    if (newFile) {
      setFiles((prev) => [newFile, ...prev]);
    }
  };

  const viewBtn = (mode, icon) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`p-2 rounded-lg transition-all ${viewMode === mode
        ? isDark ? "bg-purple-600 text-white" : "bg-[#cab9fa] text-white"
        : isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"
        }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/*Header*/}
      <div className="flex items-center gap-3">
        {/*Search*/}
        <div className="relative flex-1">
          <Search size={16} className={
            `absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-[#c4b5fd]"}`
          } />
          <input
            type="text"
            placeholder="Search files..."
            className={`${isDark ? "input-glass-dark" : "input-glass-light"} pl-11 pr-4`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/*View toggle*/}
        <div className={
          `flex items-center rounded-xl p-1 gap-1 border ${isDark ? "bg-white/5 border-white/10" : "bg-white/60 border-[#f0ebfe]"

          }`}>
          {viewBtn("grid", <Grid size={15} />)}
          {viewBtn("list", <List size={15} />)}
        </div>

        {/*Upload button*/}
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={`btn btn-sm gap-2 ${showUpload
            ? isDark ? "bg-purple-600 text-white border-0" : "bg-[#cab9fa] text-white border-0"
            : isDark ? "bg-white/5 border border-white/10 text-white/60 hover:text-white"
              : "bg-white/60 border border-[#e9e0fd] text-[#a78bfa] hover:text-[#7c3aed]"
            }`}
        >
          <Upload size={14} />
          Upload
        </button>
      </div>

      {/*Upload zone*/}
      {showUpload && (
        <div className="animate-slide-up">
          <UploadZone onUploaded={handleUploaded} />
        </div>
      )}

      {/*Files grid/list*/}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className={
            `loading loading-spinner loading-lg ${isDark ? "text-purple-500" : "text-[#a78bfa]"}`
          }></span>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20">
          <FileX size={48} className={`mx-auto mb-4 ${isDark ? "text-white/10" : "text-[#cab9fa]"}`} />
          <p className={`text-lg font-body ${isDark ? "text-white/30" : "text-gray-400"}`}>
            {search ? `No files matching "${search}"` : "No files yet"}
          </p>
          {!search && (
            <button
              onClick={() => setShowUpload(true)}
              className={`${isDark ? "btn-glow-dark" : "btn-glow-light"} btn btn-sm mt-4 gap-2`}
            >
              <Upload size={14} />
              Upload your first file
            </button>
          )}
        </div>
      ) : (
        <>
          <p className={`text-sm font-body ${isDark ? "text-white/30" : "text-gray-400"}`}>
            {files.length} file{files.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}
          </p>
          <div className={
            viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" : "space-y-2"
          }>
            {files.map((file) => <FileCard key={file._id} file={file} onDeleted={handleFileDeleted} />)}
          </div>
        </>
      )}
    </div>
  );
}
