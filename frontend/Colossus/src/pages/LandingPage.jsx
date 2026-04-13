import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0E0E0E] text-[#e5e2e1] min-h-screen font-body overflow-x-hidden">

      {/*TOP NAV*/}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/70 backdrop-blur-xl transition-all duration-300">
        <div className="flex justify-between items-center px-6 md:px-12 py-6 max-w-[1440px] mx-auto">
          <div className="text-2xl font-black tracking-tighter text-[#D1BCFF] font-headline uppercase">COLOSSUS</div>
          <div className="flex gap-6 items-center">
            <button
              onClick={() => navigate("/login")}
              className="hidden md:block text-gray-400 font-headline uppercase tracking-widest text-sm hover:text-[#D1BCFF] transition-colors">
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-br from-[#d1bcff] to-[#a277ff] text-[#3d0090] font-headline uppercase tracking-widest text-xs px-6 py-3 rounded-lg shadow-[0_10px_20px_rgba(141,91,246,0.2)] active:scale-95 transition-all font-bold">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative">

        {/*HERO*/}
        <section className="relative pt-48 pb-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d1bcff]/5 rounded-full blur-[120px] -z-10" />

          {/*Pillar logo*/}
          <div className="mb-12 relative">
            <div className="w-24 h-40 border-x-4 border-t-4 border-[#d1bcff]/40 rounded-t-xl flex items-center justify-center"
              style={{ boxShadow: "0 20px 80px rgba(141,91,246,0.2)" }}>
              <span className="material-symbols-outlined text-6xl text-[#d1bcff]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance
              </span>
            </div>
            <div className="w-32 h-4 bg-[#d1bcff]/20 mt-1 blur-sm rounded-full mx-auto" />
          </div>

          <h1 className="text-6xl md:text-8xl font-headline font-bold uppercase tracking-tighter mb-6 leading-[0.9] text-[#e5e2e1]">
            MANY DRIVES.<br />
            <span className="text-[#d1bcff]">ONE TITAN.</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-[#ccc3d7] font-body mb-12 tracking-tight opacity-80">
            Connect multiple Google Drive accounts and Colossus merges them into a single, unified storage. Auto-splits large files across drives seamlessly.
          </p>
          <div className="flex flex-col md:flex-row gap-6">
            <button
              onClick={() => navigate("/register")}
              className="px-10 py-5 bg-gradient-to-br from-[#d1bcff] to-[#a277ff] text-[#3d0090] font-headline font-bold uppercase tracking-widest rounded-xl shadow-[0_20px_40px_rgba(141,91,246,0.3)] hover:scale-105 active:scale-95 transition-all">
              Get Started
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-10 py-5 bg-transparent border border-[#4a4454] text-[#d1bcff] font-headline font-bold uppercase tracking-widest rounded-xl hover:bg-[#2a2a2a] transition-all">
              Login
            </button>
          </div>
        </section>

        {/*FEATURES*/}
        <section className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "cloud_sync", title: "Unified Storage Pool", desc: "Seamlessly aggregate storage from Google Drive into a singular, infinitely scalable monolith." },
              { icon: "splitscreen", title: "Smart Auto-Chunking", desc: "Proprietary algorithms split files into secure metadata fragments, distributed across your network for maximum speed." },
              { icon: "psychology", title: "Storage Intelligence", desc: "Neural-driven resource allocation ensures your most-used data is always hosted on the fastest available node." },
            ].map(f => (
              <div key={f.title}
                className="p-10 rounded-xl group hover:border-[#d1bcff]/40 transition-all duration-500"
                style={{ background: "rgba(19,19,19,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(209,188,255,0.1)" }}>
                <div className="mb-8 w-14 h-14 bg-[#353534] rounded-lg flex items-center justify-center text-[#d1bcff] group-hover:bg-[#d1bcff] group-hover:text-[#3d0090] transition-all">
                  <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                </div>
                <h3 className="font-headline text-xl font-bold uppercase mb-4 tracking-wide text-[#e5e2e1]">{f.title}</h3>
                <p className="text-[#ccc3d7] text-sm leading-relaxed font-body">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/*STORAGE CALCULATOR*/}
        <section className="max-w-[1200px] mx-auto px-6 py-32">
          <div className="bg-[#0e0e0e] p-12 md:p-20 rounded-2xl border border-[#4a4454]/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4edea3]/5 blur-[100px]" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-headline text-4xl font-bold uppercase mb-6 tracking-tight">
                  Scale Your <span className="text-[#4edea3]">Empire</span>
                </h2>
                <p className="text-[#ccc3d7] mb-12 font-body max-w-md">
                  Watch your capacity expand exponentially as you link more accounts. The more nodes you connect, the stronger the Titan becomes.
                </p>
                <div className="space-y-6">
                  {[
                    { label: "3 Cloud Accounts",  value: "45 GB POOL",  border: "#d1bcff", color: "#d1bcff" },
                    { label: "10 Cloud Accounts", value: "150 GB POOL", border: "#4edea3", color: "#4edea3" },
                    { label: "20 Cloud Accounts", value: "300 GB POOL", border: "#f6bc75", color: "#f6bc75" },
                  ].map(row => (
                    <div key={row.label}
                      className="flex items-center justify-between p-4 bg-[#201f1f] rounded-lg"
                      style={{ borderLeft: `4px solid ${row.border}` }}>
                      <span className="font-mono text-xs uppercase text-gray-500">{row.label}</span>
                      <span className="font-mono text-xl font-bold" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/*Pillar visualization*/}
              <div className="flex flex-col items-center justify-center p-8 bg-[#131313] rounded-xl border border-[#4a4454]/20 shadow-2xl">
                <div className="w-full flex items-end justify-around h-64 gap-4 mb-8">
                  {[
                    { height: "15%", bg: "rgba(209,188,255,0.2)", label: "LVL 1", glow: null },
                    { height: "45%", bg: "rgba(78,222,163,0.3)", label: "LVL 2", glow: "#4edea3" },
                    { height: "90%", bg: "linear-gradient(to top, rgba(209,188,255,0.1), rgba(209,188,255,0.5))", label: "MAXIMUS", glow: "#d1bcff" },
                  ].map(p => (
                    <div key={p.label} className="flex flex-col items-center w-full group">
                      <div className="w-full bg-[#353534] rounded-t-md relative transition-all"
                        style={{ height: p.height, background: p.bg }}>
                        {p.glow && <div className="absolute top-0 w-full h-1 rounded-t-md" style={{ background: p.glow, boxShadow: `0 0 15px ${p.glow}` }} />}
                      </div>
                      <div className="text-[10px] font-mono mt-4 text-gray-500">{p.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="font-mono text-3xl text-[#e5e2e1] mb-2">300.00 GB</div>
                  <div className="text-[10px] text-gray-500 font-headline uppercase tracking-widest">Total Titan Capacity Available</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*CTA BENTO*/}
        <section className="max-w-[1440px] mx-auto px-6 py-20 pb-40">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
            <div className="md:col-span-2 md:row-span-2 bg-[#d1bcff] rounded-2xl p-12 flex flex-col justify-end overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d1bcff] to-[#a277ff]" />
              <div className="relative z-10">
                <h4 className="font-headline text-4xl font-bold uppercase text-[#24005b] leading-none mb-4">Join the Network</h4>
                <p className="text-[#3d0090]/80 mb-8 max-w-xs font-body">The future of storage is collaborative. Claim your space in the monolith.</p>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-[#24005b] text-[#d1bcff] font-headline font-bold uppercase tracking-widest px-8 py-4 rounded-lg hover:bg-black transition-colors">
                  Apply for Access
                </button>
              </div>
            </div>
            <div className="md:col-span-2 bg-[#201f1f] rounded-2xl p-8 flex items-center justify-between border border-[#4a4454]/10">
              <div>
                <h5 className="font-headline font-bold uppercase text-[#e5e2e1]">Secure API</h5>
                <p className="text-xs text-[#ccc3d7] font-mono">JWT Protected</p>
              </div>
              <span className="material-symbols-outlined text-4xl text-[#d1bcff]">shield</span>
            </div>
            <div className="bg-[#1c1b1b] rounded-2xl p-8 flex flex-col justify-center border border-[#4a4454]/10">
              <div className="text-[#4edea3] font-mono text-2xl font-bold">99.9%</div>
              <div className="text-[10px] uppercase font-headline text-gray-500 tracking-tighter">Uptime Guaranteed</div>
            </div>
            <div className="bg-[#1c1b1b] rounded-2xl p-8 flex flex-col justify-center border border-[#4a4454]/10">
              <div className="text-[#d1bcff] font-mono text-2xl font-bold">OAuth 2.0</div>
              <div className="text-[10px] uppercase font-headline text-gray-500 tracking-tighter">Google Drive Secure Auth</div>
            </div>
          </div>
        </section>
      </main>

      {/*FOOTER*/}
      <footer className="w-full border-t border-[#4A4454]/20 bg-[#0E0E0E]">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-10 w-full max-w-[1440px] mx-auto">
          <div className="font-headline font-bold text-[#D1BCFF] mb-6 md:mb-0">COLOSSUS</div>
          <div className="flex gap-8 mb-6 md:mb-0">
            {["Whitepaper","API Docs","Privacy","Terminal"].map(link => (
              <a key={link} className="font-mono text-[10px] tracking-tight text-gray-600 hover:text-[#4edea3] transition-all uppercase" href="#">{link}</a>
            ))}
          </div>
          <div className="font-mono text-[10px] tracking-tight text-gray-600">
            © 2026 COLOSSUS SYSTEMS. ARCHITECTED FOR ETERNITY.
          </div>
        </div>
      </footer>
    </div>
  );
}
