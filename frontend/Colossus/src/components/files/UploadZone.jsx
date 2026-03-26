import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader, Zap, FolderInput } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import { formatBytes } from "../../utils/helpers";
import toast from "react-hot-toast";

/*UploadZone — two modes:

  mode="smart" (default)
    → Calls POST /api/files/upload
    → Backend picks the drive with most free space, splits across drives if needed
    → Used in the top toolbar — global "unified cloud" upload
    → Shows which drive received the file after upload

  mode="direct"
    → Calls POST /api/drive-explorer/:driveId/upload with folderId
    → Uploads to the exact folder the user is currently browsing
    → Used at the bottom of the file grid — contextual "Upload Here"
    → Requires driveId + folderId + folderLabel props*/
export default function UploadZone({
  mode = "smart",
  onUploaded,
  driveId,
  folderId,
  folderLabel,
}) {
  const { isDark } = useTheme();
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const inputRef = useRef();

  const isDirect = mode === "direct";

  const uploadFile = async (file) => {
    const id = Date.now() + Math.random();
    setUploads((prev) => [
      ...prev,
      { id, name: file.name, size: file.size, status: "uploading", progress: 0 },
    ]);

    try {
      if (isDirect) {
        //Direct upload — to the current folder on the current drive
        if (!driveId) throw new Error("No drive selected.");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", folderId || "root");

        await api.post(`/drive-explorer/${driveId}/upload`, formData, {
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
              ? { ...u, status: "done", message: `Saved to ${folderLabel || "current folder"}` }
              : u
          )
        );
        toast.success(`"${file.name}" uploaded to ${folderLabel || "current folder"}`);
        if (onUploaded) onUploaded(null);   //caller (FileGrid) handles its own refresh

      } else {
        //Smart upload — backend picks best drive, splits across drives if needed
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / e.total);
            setUploads((prev) =>
              prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
            );
          },
        });

        const uploadedFile = res.data.file;
        //Show where the file landed — drive email for single, "X drives" for chunked
        const driveEmail = uploadedFile?.isChunked
          ? `${uploadedFile.chunks?.length} drives`
          : uploadedFile?.singleDriveAccountEmail;

        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "done",
                  message: res.data.message,
                  isChunked: uploadedFile?.isChunked,
                  driveEmail,
                }
              : u
          )
        );
        toast.success(res.data.message || "Upload complete!");
        if (onUploaded) onUploaded(uploadedFile);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Upload failed";
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "error", message: msg } : u))
      );
      toast.error(msg);
    }
  };

  const handleFiles = (files) => Array.from(files).forEach(uploadFile);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const removeUpload = (id) => setUploads((prev) => prev.filter((u) => u.id !== id));

  //Border/bg styles vary by mode and drag state
  const borderIdle = isDirect
    ? isDark
      ? "border-violet-500/20 hover:border-violet-400/40 hover:bg-violet-500/5"
      : "border-[#d8cafd] hover:border-[#b89ef8] hover:bg-[#f7f4ff]/60"
    : isDark
    ? "border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5"
    : "border-[#e9e0fd] hover:border-[#cab9fa] hover:bg-[#f7f4ff]/50";

  const borderActive = isDirect
    ? isDark ? "border-violet-400 bg-violet-500/10" : "border-[#b89ef8] bg-[#f0ebfe]"
    : isDark ? "border-purple-400 bg-purple-500/10" : "border-[#cab9fa] bg-[#f7f4ff]";

  const iconColor = dragging
    ? isDark ? "text-purple-400" : "text-[#a78bfa]"
    : isDark ? "text-white/20" : "text-[#c4b5fd]";

  const iconBg = dragging
    ? isDark ? "bg-purple-500/20" : "bg-[#ede9fe]"
    : isDark ? "bg-white/5" : "bg-[#f7f4ff]";

  const ModeIcon = isDirect ? FolderInput : Zap;

  return (
    <div className="space-y-3">
      {/*Drop zone*/}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
          ${dragging
            ? borderActive + (isDark ? " drop-zone-active-dark" : " drop-zone-active-light")
            : borderIdle}
          ${isDirect ? "py-5 px-5" : "py-10 px-10"}`}
      >
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />

        <div className="flex flex-col items-center gap-2.5 pointer-events-none">
          <div className={`rounded-2xl flex items-center justify-center transition-all
            ${isDirect ? "w-9 h-9" : "w-14 h-14"} ${iconBg}`}>
            <ModeIcon size={isDirect ? 16 : 24} className={iconColor} />
          </div>
          <div className="text-center">
            <p className={`font-body font-medium ${isDark ? "text-white/60" : "text-gray-600"}
              ${isDirect ? "text-sm" : "text-base"}`}>
              {dragging
                ? "Drop files here"
                : isDirect ? "Drag & drop to upload here" : "Drag & drop for smart upload"}
            </p>
            <p className={`font-body mt-0.5 ${isDark ? "text-white/20" : "text-gray-400"}
              ${isDirect ? "text-xs" : "text-sm"}`}>
              {isDirect
                ? `Uploads to: ${folderLabel || "current folder"}`
                : "Auto-picks the drive with most free space · Splits if needed"}
            </p>
          </div>
        </div>

        {/*Mode pill badge — top right corner*/}
        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5
          rounded-full text-xs font-mono border
          ${isDirect
            ? isDark
              ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
              : "bg-[#f0ebfe] text-[#8b5cf6] border-[#e9e0fd]"
            : isDark
            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
            : "bg-[#f0ebfe] text-[#8b5cf6] border-[#e9e0fd]"}`}>
          <ModeIcon size={9} />
          {isDirect ? "Upload Here" : "Smart Upload"}
        </div>
      </div>

      {/*Upload queue*/}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <div key={u.id}
              className={`${isDark ? "glass-card-dark" : "glass-card-light"} px-3 py-2.5 flex items-center gap-3`}>

              {/*Status icon*/}
              <div className="shrink-0">
                {u.status === "uploading" && (
                  <Loader size={16} className={`animate-spin ${isDark ? "text-purple-400" : "text-[#a78bfa]"}`} />
                )}
                {u.status === "done" && <CheckCircle size={16} className="text-emerald-400" />}
                {u.status === "error" && <AlertCircle size={16} className="text-red-400" />}
              </div>

              {/*File info*/}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-body truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                  {u.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs font-mono ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    {formatBytes(u.size)}
                  </span>

                  {/*Progress bar while uploading*/}
                  {u.status === "uploading" && u.progress !== undefined && (
                    <div className={`flex-1 min-w-[4rem] ${isDark ? "storage-bar-dark" : "storage-bar-light"}`}>
                      <div
                        className={isDark ? "storage-fill-dark" : "storage-fill-light"}
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  )}

                  {/*Smart upload destination*/}
                  {u.status === "done" && !isDirect && u.driveEmail && (
                    <span className={`text-xs font-body ${isDark ? "text-purple-300/70" : "text-[#8b5cf6]"}`}>
                      → {u.isChunked ? `split across ${u.driveEmail}` : u.driveEmail}
                    </span>
                  )}

                  {/*Direct upload destination*/}
                  {u.status === "done" && isDirect && (
                    <span className={`text-xs font-body ${isDark ? "text-violet-300/70" : "text-[#8b5cf6]"}`}>
                      → {folderLabel || "current folder"}
                    </span>
                  )}

                  {u.status === "error" && (
                    <span className="text-red-400 text-xs font-body truncate">{u.message}</span>
                  )}
                </div>
              </div>

              {/*Dismiss*/}
              {u.status !== "uploading" && (
                <button onClick={() => removeUpload(u.id)}
                  className={`btn btn-ghost btn-xs shrink-0 ${isDark
                    ? "text-white/20 hover:text-white/60" : "text-gray-300 hover:text-gray-600"}`}>
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
