import { useEffect, useState } from "react";
import { X, Download, ExternalLink, Loader, AlertCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { getFileTypeInfo } from "../../utils/helpers";

const PREVIEWABLE_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const PREVIEWABLE_VIDEO = ["video/mp4", "video/webm", "video/ogg"];
const PREVIEWABLE_AUDIO = ["audio/mpeg", "audio/ogg", "audio/wav"];
const PREVIEWABLE_PDF = ["application/pdf"];

function getPreviewType(mimeType) {
  if (PREVIEWABLE_IMAGES.includes(mimeType)) return "image";
  if (PREVIEWABLE_VIDEO.includes(mimeType)) return "video";
  if (PREVIEWABLE_AUDIO.includes(mimeType)) return "audio";
  if (PREVIEWABLE_PDF.includes(mimeType)) return "pdf";
  if (mimeType && mimeType.startsWith("text/")) return "text";
  return null;
}

export default function FilePreviewModal({ file, onClose, onDownload }) {
  const { isDark } = useTheme();

  const previewType = getPreviewType(file.mimeType);
  const typeInfo = getFileTypeInfo(file.mimeType, file.name);
  const token = localStorage.getItem("colossus_token");

  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(previewType !== "video");
  const [error, setError] = useState(null);

  //For video, stream directly from Drive via URL with token as query param- no blob needed
  const streamUrl = `/api/drive-explorer/${file.driveId}/files/${file.id}/view?inline=true&token=${localStorage.getItem("colossus_token")}`;

  useEffect(() => {
    //Video uses stream URL directly, no fetch needed
    if (previewType === "video") {
      return;
    }

    let localBlobUrl = null;

    fetch(`/api/drive-explorer/${file.driveId}/files/${file.id}/view?inline=true`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to load file");
      if (previewType === "text") {
        const text = await res.text();
        setTextContent(text);
      } else {
        const blob = await res.blob();
        localBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(localBlobUrl);
      }
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));

    return () => {
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [file.id, file.driveId, previewType, token]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const modalBg = isDark ? "bg-[#0d0d14]" : "bg-white";
  const headerBg = isDark ? "bg-[#1a1a25] border-b border-white/10" : "bg-[#f7f4ff] border-b border-gray-200";
  const textMain = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-white/40" : "text-gray-400";
  const btnSecondary = isDark ? "bg-white/5 border-white/10 text-white/60 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900";
  const btnPrimary = isDark ? "bg-purple-600 text-white border-0 hover:bg-purple-500" : "bg-[#cab9fa] text-gray-900 border-0 hover:bg-[#b89ef8]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-3 px-5 py-4 ${headerBg}`}>
          <span className="text-xl">{typeInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-body font-medium truncate ${textMain}`}>{file.name}</p>
            <p className={`text-xs font-mono ${textMuted}`}>{file.mimeType}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!file.isGoogleDoc && (
              <button onClick={() => onDownload(file.id, file.name)} className={`btn btn-xs gap-1 ${btnSecondary}`}>
                <Download size={13} /> Download
              </button>
            )}
            {file.webViewLink && (
              <a href={file.webViewLink} target="_blank" rel="noreferrer" className={`btn btn-xs gap-1 ${btnSecondary}`}>
                <ExternalLink size={13} /> Open
              </a>
            )}
            <button onClick={onClose} className={`btn btn-xs btn-ghost 
              ${isDark ?
                "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900"
              }`}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center min-h-0 bg-black/20">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader size={32} className={`animate-spin ${isDark ? "text-purple-400" : "text-[#a78bfa]"}`} />
              <p className={`text-sm font-body ${textMuted}`}>Loading preview...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-3 py-16">
              <AlertCircle size={36} className="text-red-400" />
              <p className={`text-sm font-body ${textMuted}`}>Failed to load preview</p>
            </div>
          )}
          {!loading && !error && previewType === "image" && blobUrl && (
            <img src={blobUrl} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          )}
          {!loading && !error && previewType === "video" && (
            <video controls autoPlay className="max-w-full max-h-[70vh] rounded-lg" src={streamUrl} />
          )}
          {!loading && !error && previewType === "audio" && blobUrl && (
            <div className="p-8 flex flex-col items-center gap-4">
              <span className="text-6xl">🎵</span>
              <p className={`font-body ${textMain}`}>{file.name}</p>
              <audio controls src={blobUrl} className="w-full max-w-md" />
            </div>
          )}
          {!loading && !error && previewType === "pdf" && blobUrl && (
            <iframe src={blobUrl} title={file.name} className="w-full h-[70vh]" />
          )}
          {!loading && !error && previewType === "text" && textContent !== null && (
            <pre className={`w-full p-6 text-sm font-mono overflow-auto max-h-[70vh] whitespace-pre-wrap ${textMain}`}>{textContent}</pre>
          )}
          {!loading && !error && !previewType && (
            <div className="flex flex-col items-center gap-4 py-16">
              <span className="text-6xl">{typeInfo.icon}</span>
              <p className={`font-body font-medium ${textMain}`}>{file.name}</p>
              <p className={`text-sm font-body ${textMuted}`}>Preview not available for this file type</p>
              {file.webViewLink && (
                <a href={file.webViewLink} target="_blank" rel="noreferrer" className={`btn btn-sm gap-2 ${btnPrimary}`}>
                  <ExternalLink size={14} /> Open in Google Drive
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
