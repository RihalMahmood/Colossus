import { Image, Film, Music, FileText, Archive, Code, Table, File } from "lucide-react";

//Shared style
export const glass = {
  background: "rgba(19,19,19,0.75)",
  backdropFilter: "blur(20px)",
};

//Formatters
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

//File icon helper
export function getFileIcon(name = "", mimeType = "") {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) || mimeType.startsWith("image/"))
    return { Icon: Image, color: "text-emerald-400" };
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext) || mimeType.startsWith("video/"))
    return { Icon: Film, color: "text-amber-400" };
  if (["mp3", "wav", "ogg", "flac"].includes(ext) || mimeType.startsWith("audio/"))
    return { Icon: Music, color: "text-amber-400" };
  if (ext === "pdf") return { Icon: FileText, color: "text-red-400" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { Icon: Archive, color: "text-slate-400" };
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "html", "css", "json"].includes(ext))
    return { Icon: Code, color: "text-purple-400" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "text-blue-400" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: Table, color: "text-emerald-400" };
  return { Icon: File, color: "text-slate-400" };
}

//Misc
export function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
