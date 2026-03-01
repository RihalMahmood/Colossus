import { Link } from "react-router-dom";
import { Cloud, Layers, Zap, Shield, ChevronRight } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ui/ThemeToggle";

export default function LandingPage() {
  const { isDark } = useTheme();

  const t = isDark
    ? {
        text: "text-white",
        textMuted: "text-white/50",
        textFaint: "text-white/40",
        card: "glass-card-dark",
        btn: "btn-glow-dark",
        btnGhost: "btn btn-ghost border border-white/10 text-white/70 hover:text-white hover:border-white/20",
        badge: "border border-purple-500/30 bg-purple-500/10 text-purple-300",
        accent: "text-purple-400",
        statCard: "glass-card-dark",
        featureIcon1: "text-purple-400",
        featureIcon2: "text-violet-400",
        featureIcon3: "text-cyan-400",
      }
    : {
        text: "text-gray-900",
        textMuted: "text-gray-500",
        textFaint: "text-gray-400",
        card: "glass-card-light",
        btn: "btn-glow-light",
        btnGhost: "btn btn-ghost border border-rose-200 text-rose-400 hover:text-rose-600 hover:border-rose-300",
        badge: "border border-rose-300 bg-rose-50 text-rose-500",
        accent: "text-rose-500",
        statCard: "glass-card-light",
        featureIcon1: "text-rose-400",
        featureIcon2: "text-pink-400",
        featureIcon3: "text-fuchsia-400",
      };

  return (
    <div className="relative min-h-screen overflow-hidden font-body">
      {/*Navbar*/}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-gradient-to-br from-purple-500 to-violet-700" : "bg-gradient-to-br from-rose-400 to-pink-600"}`}>
            <Cloud size={16} className="text-white" />
          </div>
          <span className={`font-display font-bold text-xl tracking-tight ${t.text}`}>Colossus</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className={`btn btn-ghost btn-sm font-body ${t.textMuted} hover:${t.text}`}>Sign in</Link>
          <Link to="/register" className={`${t.btn} btn btn-sm px-5`}>Get started</Link>
        </div>
      </nav>

      {/*Hero*/}
      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-32 text-center animate-fade-in">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-body mb-8 ${t.badge}`}>
          <Zap size={14} />
          <span>Unlimited storage across all your Google Drives</span>
        </div>

        <h1 className={`font-display text-6xl md:text-7xl font-extrabold leading-tight mb-6 ${t.text}`}>
          Many drives.{" "}
          <span className={`bg-clip-text text-transparent ${isDark ? "bg-gradient-to-r from-purple-400 to-violet-400" : "bg-gradient-to-r from-rose-400 to-pink-500"}`}>
            One titan.
          </span>
        </h1>

        <p className={`text-xl max-w-2xl mx-auto mb-12 font-body leading-relaxed ${t.textMuted}`}>
          Connect multiple Google Drive accounts and Colossus merges them into a single,
          unified storage. Auto-splits large files across drives seamlessly.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className={`${t.btn} btn btn-lg gap-2 px-8`}>
            Start for free <ChevronRight size={18} />
          </Link>
          <Link to="/login" className={`${t.btnGhost} gap-2 btn-lg`}>
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
            <div key={stat.label} className={`${t.statCard} p-6`}>
              <div className={`font-display text-3xl font-bold mb-1 ${t.text}`}>{stat.value}</div>
              <div className={`text-sm font-body ${t.textFaint}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/*Features*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {[
            { icon: <Layers size={20} className={t.featureIcon1} />, title: "Smart Chunking", desc: "Files too large for one drive? Colossus splits them automatically and reassembles on download." },
            { icon: <Shield size={20} className={t.featureIcon2} />, title: "Secure Auth", desc: "Google OAuth means your Drive credentials never touch our servers." },
            { icon: <Zap size={20} className={t.featureIcon3} />, title: "Unified View", desc: "Search, browse, and download all files across all drives from one interface." },
          ].map((f) => (
            <div key={f.title} className={`${t.card} p-6 text-left`}>
              <div className="mb-3">{f.icon}</div>
              <h3 className={`font-display font-semibold mb-2 ${t.text}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed font-body ${t.textFaint}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
