import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import { formatBytes } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function UploadZone({ onUploaded }) {
  const { isDark } = useTheme();
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]);   //{ id, file, status, progress, result }
  const inputRef = useRef();

  const uploadFile = async (file) => {
    const id = Date.now() + Math.random();      //Unique ID for this upload session
    setUploads((prev) => [...prev, { id, name: file.name, size: file.size, status: "uploading" }]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
          );
        },
      });

      setUploads((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: "done", message: res.data.message, isChunked: res.data.file?.isChunked }
            : u
        )
      );

      if (onUploaded) onUploaded(res.data.file);
      toast.success(res.data.message || "Upload complete!");
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "error", message: msg } : u))
      );
      toast.error(msg);
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-4">
      {/*Drop zone*/}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? isDark
              ? "border-purple-400 bg-purple-500/10 drop-zone-active-dark"
              : "border-[#cab9fa] bg-[#f7f4ff] drop-zone-active-light"
            : isDark
              ? "border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5"
              : "border-[#e9e0fd] hover:border-[#cab9fa] hover:bg-[#f7f4ff]/50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all 
          ${dragging
              ? isDark ? "bg-purple-500/30" : "bg-[#f0ebfe]"
              : isDark ? "bg-white/5" : "bg-[#f7f4ff]"
            }`}>
            <Upload size={24} className={dragging ?
              isDark ? "text-purple-400" : "text-[#a78bfa]"
              : isDark ? "text-white/30" : "text-[#c4b5fd]"}
            />
          </div>
          <div>
            <p className={`font-body font-medium ${isDark ? "text-white/60" : "text-gray-600"}`}>
              {dragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className={`text-sm font-body mt-1 ${isDark ? "text-white/20" : "text-gray-400"}`}>
              or click to browse • Files split automatically if needed
            </p>
          </div>
        </div>
      </div>

      {/*Upload queue*/}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <div key={u.id} className={`${isDark ? "glass-card-dark" : "glass-card-light"} p-3 flex items-center gap-3`}>
              {/*Status icon*/}
              <div className="shrink-0">
                {u.status === "uploading" && (
                  <Loader size={18} className={`animate-spin ${isDark ? "text-purple-400" : "text-[#a78bfa]"}`} />
                )}
                {u.status === "done" && (
                  <CheckCircle size={18} className="text-emerald-400" />
                )}
                {u.status === "error" && (
                  <AlertCircle size={18} className="text-red-400" />
                )}
              </div>

              {/*File info*/}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-body truncate ${isDark ? "text-white" : "text-gray-900"}`}>{u.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`text-xs font-mono ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    {formatBytes(u.size)}
                  </p>
                  {u.status === "uploading" && u.progress !== undefined && (
                    <div className={`flex-1 ${isDark ? "storage-bar-dark" : "storage-bar-light"}`}>
                      <div
                        className={isDark ? "storage-fill-dark" : "storage-fill-light"}
                        style={{ width: `${u.progress}%` }} />
                    </div>
                  )}
                  {u.status === "done" && u.isChunked && (
                    <span className={`text-xs font-body ${isDark ? "text-violet-300" : "text-[#a78bfa]"}`}>
                      • split across drives
                    </span>
                  )}
                  {u.status === "error" && (
                    <span className="text-red-400 text-xs font-body truncate">{u.message}</span>
                  )}
                </div>
              </div>

              {/*Remove*/}
              {u.status !== "uploading" && (
                <button
                  onClick={() => removeUpload(u.id)}
                  className={`btn btn-ghost btn-xs ${isDark ?
                    "text-white/20 hover:text-white/60" : "text-gray-300 hover:text-gray-600"
                    }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
