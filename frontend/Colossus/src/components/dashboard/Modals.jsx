import { useState } from "react";
import { createPortal } from "react-dom";
import { glass } from "./dashboardUtils";

//Delete Confirm Modal
export function DeleteModal({ fileName, onClose, onConfirm }) {
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-[#4a4454]/30 shadow-2xl p-8" style={glass}>
        <h3 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-red-400 mb-3">Delete File</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Permanently delete <span className="text-white font-semibold">{fileName}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#4a4454]/30 text-slate-400 text-xs font-mono uppercase tracking-widest hover:border-[#d1bcff]/30 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500/90 text-white text-xs font-mono font-bold uppercase tracking-widest hover:bg-red-500 transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

//Create Folder Modal
export function CreateFolderModal({ onClose, onConfirm }) {
  const [name, setName] = useState("");
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-[#4a4454]/30 shadow-2xl p-8" style={glass}>
        <h3 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#d1bcff] mb-5">New Folder</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm(name.trim())}
          placeholder="Folder name"
          className="w-full bg-[#0e0e0e] border border-[#4a4454]/30 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d1bcff]/40 transition-all mb-5"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#4a4454]/30 text-slate-400 text-xs font-mono uppercase tracking-widest hover:border-[#d1bcff]/30 transition-all">
            Cancel
          </button>
          <button onClick={() => name.trim() && onConfirm(name.trim())} disabled={!name.trim()}
            className="flex-1 py-3 rounded-xl bg-[#d1bcff] text-[#3d0090] text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#e0d0ff] transition-all disabled:opacity-40">
            Create
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
