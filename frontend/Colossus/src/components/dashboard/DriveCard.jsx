import { glass, formatBytes } from "./dashboardUtils";

export default function DriveCard({ drive, onDisconnect }) {
  const q = drive.quota || {};
  const pct = q.total > 0 ? Math.round((q.used / q.total) * 100) : 0;
  const circ = 125.6;
  const offset = circ - (circ * pct / 100);

  return (
    <div className="min-w-[300px] rounded-xl border border-l-4 border-[#4a4454]/20 border-l-[#d1bcff] p-6 flex-shrink-0 transition-all hover:border-[#d1bcff]/30"
      style={glass}>
      <div className="flex justify-between items-start mb-6">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-xs font-bold text-white truncate">{drive.email}</p>
          <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{drive.displayName || "Google Drive"}</p>
        </div>
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="transparent" stroke="#353534" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="transparent" stroke="#d1bcff" strokeWidth="4"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
          </svg>
          <span className="absolute text-[8px] font-bold font-mono text-[#d1bcff]">{pct}%</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Available</p>
          <p className="text-lg font-bold font-mono text-white">{formatBytes(q.free)}</p>
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">{formatBytes(q.used)} / {formatBytes(q.total)} used</p>
        </div>
        <button onClick={() => onDisconnect(drive._id, drive.email)}
          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all">
          Disconnect
        </button>
      </div>
    </div>
  );
}
