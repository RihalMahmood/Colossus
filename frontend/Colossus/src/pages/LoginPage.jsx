import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await login(email, password);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0e0e0e] text-[#e5e2e1] min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-body">

      {/*Background Image*/}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/images/bg-login.png"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      {/*Ambient Glow Blobs*/}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#d1bcff]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#a277ff]/10 blur-[120px]" />
      </div>

      {/*Login Container*/}
      <main className="relative z-10 w-full max-w-md px-6">
        <div
          className="rounded-xl p-10 flex flex-col items-center border border-[#4a4454]/20"
          style={{
            background: "rgba(19, 19, 19, 0.7)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 80px rgba(162, 119, 255, 0.08)",
          }}
        >
          {/*Logo Section*/}
          <div className="mb-10 flex flex-col items-center gap-3">
            <div
              className="w-16 h-20 bg-gradient-to-b from-[#d1bcff] to-[#a277ff] rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(209,188,255,0.3)]"
              style={{ transform: "skewX(-12deg)" }}
            >
              <span
                className="material-symbols-outlined text-[#35007f] text-4xl"
                style={{ fontVariationSettings: "'FILL' 1", transform: "skewX(12deg)" }}
              >
                dataset
              </span>
            </div>
            <h1 className="font-headline font-bold text-2xl tracking-tighter text-[#d1bcff]">
              COLOSSUS
            </h1>
          </div>

          {/*Header*/}
          <div className="w-full text-center mb-10">
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-[#d1bcff]">
              Welcome Back
            </h2>
            <p className="text-[#ccc3d7]/60 mt-2 text-sm">
              Access your secure vault on the monolith
            </p>
          </div>

          {/*Form*/}
          <form onSubmit={handleSubmit} className="w-full space-y-6">

            {/*Email Field*/}
            <div className="space-y-1.5">
              <label className="text-[#ccc3d7] text-[10px] uppercase font-bold tracking-widest">
                Endpoint Identity
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@vault.monolith"
                  className="w-full bg-[#0e0e0e] border-0 border-b-2 border-[#4a4454]/30 focus:border-[#d1bcff] focus:ring-0 text-[#e5e2e1] placeholder:text-zinc-700 py-3 pr-8 transition-all duration-300 outline-none"
                />
                <span className="material-symbols-outlined absolute right-0 bottom-3 text-[#ccc3d7]/30 group-focus-within:text-[#d1bcff] transition-colors text-xl">
                  alternate_email
                </span>
              </div>
            </div>

            {/*Password Field*/}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[#ccc3d7] text-[10px] uppercase font-bold tracking-widest">
                  Security Key
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[10px] uppercase tracking-tighter text-[#d1bcff] hover:text-[#eaddff] transition-colors"
                >
                  Lost Access?
                </a>
              </div>
              <div className="relative group">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0e0e0e] border-0 border-b-2 border-[#4a4454]/30 focus:border-[#d1bcff] focus:ring-0 text-[#e5e2e1] placeholder:text-zinc-700 py-3 pr-8 transition-all duration-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-0 bottom-3 text-[#ccc3d7]/30 hover:text-[#d1bcff] transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPass ? "visibility_off" : "encrypted"}
                  </span>
                </button>
              </div>
            </div>

            {/*Submit Button*/}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-[#d1bcff] to-[#a277ff] text-[#35007f] font-headline font-bold py-4 rounded-lg uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(162,119,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Initiate Login"}
              {!loading && (
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              )}
            </button>
          </form>

          {/*Register Link*/}
          <div className="mt-8 text-center">
            <Link
              to="/register"
              className="text-xs font-label uppercase tracking-widest text-[#ccc3d7]/80 hover:text-[#d1bcff] transition-colors flex items-center gap-2 justify-center"
            >
              New here?
              <span className="text-[#d1bcff] font-bold hover:underline underline-offset-4 decoration-[#d1bcff]/30">
                Register instead
              </span>
            </Link>
          </div>
        </div>

        {/*Security Badge*/}
        <div className="mt-8 flex justify-center items-center gap-4 opacity-40">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">shield_lock</span>
            <span className="text-[10px] font-label tracking-tighter uppercase">JWT Protected</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#4a4454]" />
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">cloud_done</span>
            <span className="text-[10px] font-label tracking-tighter uppercase">OAuth 2.0</span>
          </div>
        </div>
      </main>

      {/*Footer*/}
      <footer className="fixed bottom-0 w-full flex justify-center pb-10 z-50">
        <div className="flex gap-8 items-center text-zinc-600 text-xs tracking-widest uppercase">
          {["Privacy", "Terms", "Security"].map((item) => (
            <span
              key={item}
              className="opacity-80 hover:opacity-100 hover:text-[#d1bcff] transition-all cursor-pointer"
            >
              {item}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
