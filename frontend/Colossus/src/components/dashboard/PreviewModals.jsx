import { createPortal } from "react-dom";
import { X, Download, File, Music } from "lucide-react";
import { glass } from "./dashboardUtils";

export default function PreviewModal({ file, driveId, onClose }) {
  const token = localStorage.getItem("colossus_token");
  const viewUrl = `/api/drive-explorer/${driveId}/files/${file.id}/view?token=${token}`;
  const isImage = file.mimeType?.startsWith("image/");
  const isVideo = file.mimeType?.startsWith("video/");
  const isAudio = file.mimeType?.startsWith("audio/");
  const isPdf = file.mimeType === "application/pdf";

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#4a4454]/30 shadow-2xl overflow-hidden flex flex-col"
        style={{ ...glass, maxHeight: "90vh" }}>
        {/*Header*/}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4454]/20 flex-shrink-0">
          <p className="text-sm font-mono font-bold text-white truncate max-w-[70%]">{file.name}</p>
          <div className="flex items-center gap-3">
            <a href={`/api/drive-explorer/${driveId}/files/${file.id}/download?token=${token}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d1bcff]/10 border border-[#d1bcff]/20 text-[#d1bcff] text-xs font-mono uppercase hover:bg-[#d1bcff]/20 transition-all">
              <Download size={12} /> Download
            </a>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/*Preview*/}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
          {isImage && <img src={viewUrl} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg" />}
          {isVideo && (
            <video controls className="max-w-full max-h-full rounded-lg" style={{ maxHeight: "70vh" }}>
              <source src={viewUrl} type={file.mimeType} />
            </video>
          )}
          {isAudio && (
            <div className="flex flex-col items-center gap-6 p-10">
              <Music size={64} className="text-amber-400" />
              <p className="text-slate-400 font-mono text-sm">{file.name}</p>
              <audio controls src={viewUrl} className="w-full max-w-sm" />
            </div>
          )}
          {isPdf && (
            <iframe src={viewUrl} className="w-full rounded-lg border border-[#4a4454]/20"
              style={{ height: "70vh" }} title={file.name} />
          )}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="text-center py-16">
              <File size={56} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400 font-mono text-sm mb-4">Preview not available</p>
              <a href={`/api/drive-explorer/${driveId}/files/${file.id}/download?token=${token}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d1bcff]/10 border border-[#d1bcff]/20 text-[#d1bcff] text-xs font-mono uppercase hover:bg-[#d1bcff]/20 transition-all">
                <Download size={14} /> Download Instead
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
