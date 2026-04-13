import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CloudUpload, CheckCircle, AlertCircle } from "lucide-react";
import { glass, formatBytes } from "./dashboardUtils";
import toast from "react-hot-toast";

export default function UploadModal({ onClose, onSuccess, targetDriveId = null, targetFolderId = "root" }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef();

  const handleFile = (file) => { if (file) setSelectedFile(file); };

  const startUpload = () => {
    if (!selectedFile) { toast("Please select a file first", { icon: "⚠️" }); return; }
    setUploading(true); setProgress(0); setStatus(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (targetDriveId) formData.append("folderId", targetFolderId);

    const token = localStorage.getItem("colossus_token");
    const endpoint = targetDriveId
      ? `/api/drive-explorer/${targetDriveId}/upload`
      : "/api/files/upload";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) { setStatus("done"); setMessage(data.message || "Uploaded successfully"); onSuccess?.(); }
        else { setStatus("error"); setMessage(data.message || "Upload failed"); }
      } catch { setStatus("error"); setMessage("Upload failed"); }
    };
    xhr.onerror = () => { setUploading(false); setStatus("error"); setMessage("Network error"); };
    xhr.send(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!uploading ? onClose : undefined} />
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-[#4a4454]/30 shadow-2xl" style={glass}>
        <div className="flex items-center justify-between p-6 border-b border-[#4a4454]/20">
          <h3 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#d1bcff]">
            {targetDriveId ? "Upload to Drive Folder" : "Upload to Colossus"}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center gap-3
              ${dragging ? "border-[#d1bcff] bg-[#d1bcff]/5" : "border-[#4a4454]/40 hover:border-[#d1bcff]/40"}`}>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <CloudUpload size={36} className="text-slate-500" />
            <p className="text-sm text-slate-400">Drag & drop or <span className="text-[#d1bcff] underline">browse</span></p>
            <p className="text-xs text-slate-600 font-mono uppercase tracking-wider">
              {selectedFile ? `${selectedFile.name} (${formatBytes(selectedFile.size)})` : "No file selected"}
            </p>
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 font-mono uppercase mb-2">
                <span>Uploading...</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-[#353534] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#d1bcff] to-[#a277ff] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {status === "done" && <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono"><CheckCircle size={16} />{message}</div>}
          {status === "error" && <div className="flex items-center gap-2 text-red-400 text-sm font-mono"><AlertCircle size={16} />{message}</div>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#4a4454]/30 text-slate-400 text-xs font-mono uppercase tracking-widest hover:border-[#d1bcff]/30 transition-all">
              {status === "done" ? "Close" : "Cancel"}
            </button>
            {status !== "done" && (
              <button onClick={startUpload} disabled={uploading || !selectedFile}
                className="flex-1 py-3 rounded-xl bg-[#d1bcff] text-[#3d0090] text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#e0d0ff] transition-all disabled:opacity-40">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
