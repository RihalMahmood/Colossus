import { Link } from "react-router-dom";
import { Cloud, Layers, Zap, Shield, ChevronRight, Github } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden font-body">
      {/*Ibelick background*/}
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>

      {/*Navbar*/}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
            <Cloud size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">Colossus</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn btn-ghost btn-sm text-white/70 hover:text-white font-body">
            Sign in
          </Link>
          <Link to="/register" className="btn-glow btn btn-sm px-5">
            Get started
          </Link>
        </div>
      </nav>

      {/*Hero*/}
      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-32 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-body mb-8">
          <Zap size={14} />
          <span>Unlimited storage across all your Google Drives</span>
        </div>

        <h1 className="font-display text-6xl md:text-7xl font-extrabold text-white leading-tight mb-6">
          Many drives.{" "}
          <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            One titan.
          </span>
        </h1>

        <p className="text-white/50 text-xl max-w-2xl mx-auto mb-12 font-body leading-relaxed">
          Connect multiple Google Drive accounts and Colossus merges them into a single, 
          unified storage. Auto-splits large files across drives seamlessly.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="btn-glow btn btn-lg gap-2 px-8">
            Start for free <ChevronRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-lg btn-ghost border border-white/10 text-white/70 hover:text-white hover:border-white/20 gap-2">
            Sign in
          </Link>
        </div>

        {/*Stats*/}
        <div className="grid grid-cols-3 gap-6 mt-24 max-w-2xl mx-auto">
          {[
            { value: "15 GB", label: "per Drive account" },
            { value: "∞", label: "accounts supported" },
            { value: "100%", label: "free to use" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-6">
              <div className="font-display text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-white/40 text-sm font-body">{stat.label}</div>
            </div>
          ))}
        </div>

        {/*Features*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {[
            {
              icon: <Layers size={20} className="text-purple-400" />,
              title: "Smart Chunking",
              desc: "Files too large for one drive? Colossus splits them automatically and reassembles on download.",
            },
            {
              icon: <Shield size={20} className="text-violet-400" />,
              title: "Secure Auth",
              desc: "Google OAuth means your Drive credentials never touch our servers.",
            },
            {
              icon: <Zap size={20} className="text-cyan-400" />,
              title: "Unified View",
              desc: "Search, browse, and download all files across all drives from one interface.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6 text-left">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
