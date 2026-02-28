import { Download, Trash2, Layers, HardDrive } from "lucide-react";
import { formatBytes, formatDate, getFileTypeInfo } from "../../utils/helpers";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function FileCard({ file, onDeleted }) {
  const typeInfo = getFileTypeInfo(file.mimeType, file.name);

  const handleDownload = () => {
    const token = localStorage.getItem("colossus_token");
    const url = `/api/files/${file._id}/download`;

    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", file.name);

    //Use fetch with auth header for download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Download failed");
        return res.blob();      //Convert response to blob (blob is a file-like object in JS) for download. 
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        toast.success(`Downloading ${file.name}`);
      })
      .catch(() => toast.error("Failed to download file"));
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${file.name}"? This will remove it from Google Drive too.`)) return;
    try {
      await api.delete(`/files/${file._id}`);
      toast.success("File deleted");
      onDeleted(file._id);
    } catch {
      toast.error("Failed to delete file.");
    }
  };

  return (
    <div className="file-card group">
      {/*File type icon*/}
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl select-none">{typeInfo.icon}</div>
        {file.isChunked && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs">
            <Layers size={10} />
            <span className="font-mono">{file.chunks?.length} chunks</span>
          </div>
        )}
      </div>

      {/*File name*/}
      <p className="text-white font-body font-medium text-sm truncate mb-1" title={file.name}>
        {file.name}
      </p>

      {/*Metadata*/}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between text-xs text-white/30 font-mono">
          <span>{formatBytes(file.totalSize)}</span>
          <span className={typeInfo.color}>{typeInfo.label}</span>
        </div>
        <p className="text-xs text-white/20 font-body">{formatDate(file.createdAt)}</p>
      </div>

      {/*Drive indicator*/}
      {!file.isChunked && file.singleDriveAccountEmail && (
        <div className="flex items-center gap-1.5 text-xs text-white/20 font-body mb-3 truncate">
          <HardDrive size={11} />
          <span className="truncate">{file.singleDriveAccountEmail}</span>
        </div>
      )}

      {/*Actions*/}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={handleDownload}
          className="btn btn-xs flex-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 gap-1"
        >
          <Download size={12} />
          Download
        </button>
        <button
          onClick={handleDelete}
          className="btn btn-xs btn-ghost text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
