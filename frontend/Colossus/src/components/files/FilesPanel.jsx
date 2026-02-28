import { useEffect, useState, useCallback } from "react";
import { Search, Upload, Grid, List, FileX, Filter } from "lucide-react";
import api from "../../utils/api";
import FileCard from "./FileCard";
import UploadZone from "./UploadZone";
import toast from "react-hot-toast";

export default function FilesPanel() {
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

  //Debounced search
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

  return (
    <div className="space-y-5 animate-fade-in">
      {/*Header*/}
      <div className="flex items-center gap-3">
        {/*Search*/}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search files..."
            className="input-glass pl-11 pr-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/*View toggle*/}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-white/30 hover:text-white"}`}
          >
            <Grid size={15} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-purple-600 text-white" : "text-white/30 hover:text-white"}`}
          >
            <List size={15} />
          </button>
        </div>

        {/*Upload button*/}
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={`btn btn-sm gap-2 ${showUpload ? "bg-purple-600 text-white border-0" : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20"}`}
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
          <span className="loading loading-spinner loading-lg text-purple-500"></span>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20">
          <FileX size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/30 font-body text-lg">
            {search ? `No files matching "${search}"` : "No files yet"}
          </p>
          {!search && (
            <button
              onClick={() => setShowUpload(true)}
              className="btn-glow btn btn-sm mt-4 gap-2"
            >
              <Upload size={14} />
              Upload your first file
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-white/30 text-sm font-body">
              {files.length} file{files.length !== 1 ? "s" : ""}
              {search && <span> matching "{search}"</span>}
            </p>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {files.map((file) => (
                <FileCard key={file._id} file={file} onDeleted={handleFileDeleted} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <FileCard key={file._id} file={file} onDeleted={handleFileDeleted} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
