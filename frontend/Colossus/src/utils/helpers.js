//Format bytes to human-readable string
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

//Get percentage
export function getUsagePercent(used, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

//Get color for storage bar based on usage
export function getStorageColor(percent) {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-yellow-500";
  return null;  //use default gradient
}

//Get file icon based on mimetype
export function getFileTypeInfo(mimeType = "", name = "") {
  const ext = name.split(".").pop().toLowerCase();

  const types = {
    image: { icon: "🖼️", color: "text-pink-400", label: "Image" },
    video: { icon: "🎥", color: "text-red-400", label: "Video" },
    audio: { icon: "🎶", color: "text-yellow-400", label: "Audio" },
    "application/pdf": { icon: "📄", color: "text-red-300", label: "PDF" },
    archive: { icon: "🗜️", color: "text-orange-400", label: "Archive" },
    code: { icon: "💻", color: "text-green-400", label: "Code" },
    text: { icon: "📝", color: "text-blue-300", label: "Text" },
    spreadsheet: { icon: "📊", color: "text-emerald-400", label: "Spreadsheet" },
    presentation: { icon: "📽️", color: "text-purple-400", label: "Presentation" },
  };

  if (mimeType.startsWith("image/")) return types.image;
  if (mimeType.startsWith("video/")) return types.video;
  if (mimeType.startsWith("audio/")) return types.audio;
  if (mimeType === "application/pdf") return types["application/pdf"];
  if (mimeType.includes("spreadsheet") || ["xlsx", "xls", "csv"].includes(ext)) return types.spreadsheet;
  if (mimeType.includes("presentation") || ["pptx", "ppt"].includes(ext)) return types.presentation;
  if (mimeType.startsWith("text/") || ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "go", "rs"].includes(ext)) return types.code;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return types.archive;
  if (mimeType.startsWith("text/")) return types.text;

  return { icon: "📁", color: "text-slate-400", label: "File" };
}

//Format date nicely
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const day = 1000 * 60 * 60 * 24;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < day) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

//Get initials from name
export function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
