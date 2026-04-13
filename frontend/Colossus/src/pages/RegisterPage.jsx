import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        toast.error(res.data.message || "Registration failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0E0E0E] text-[#e5e2e1] min-h-screen flex flex-col items-center justify-center overflow-hidden font-body">

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

      {/*Nav*/}
      <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-6 bg-transparent backdrop-blur-xl z-50">
        <Link to="/"
          className="text-2xl font-bold tracking-tighter text-[#d1bcff] font-headline uppercase hover:opacity-80 transition-opacity">
          COLOSSUS
        </Link>
        <div className="flex gap-6 items-center">
          <span className="material-symbols-outlined text-zinc-500 cursor-pointer hover:text-[#d1bcff] transition-colors">help</span>
          <span className="material-symbols-outlined text-zinc-500 cursor-pointer hover:text-[#d1bcff] transition-colors">info</span>
        </div>
      </nav>

      {/*Register card*/}
      <main className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-xl p-10 border border-[#4a4454]/10"
          style={{
            background: "rgba(19,19,19,0.7)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px rgba(141,91,246,0.05), 0 0 60px rgba(141,91,246,0.1)",
          }}>

          {/*Header*/}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#d1bcff] to-[#a277ff] rounded-xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(209,188,255,0.3)]">
              <span className="material-symbols-outlined text-[#3d0090] text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                cloud_done
              </span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-[#d1bcff] tracking-tight text-center uppercase">
              Join the Monolith
            </h1>
            <p className="text-[#ccc3d7] font-label text-sm mt-2 tracking-wide uppercase opacity-70">
              Secure your digital legacy
            </p>
          </div>

          {/*Form*/}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/*Full Name*/}
            <div className="space-y-1.5">
              <label className="text-[#ccc3d7] text-[10px] uppercase font-bold tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ARCHITECT NAME"
                  className="w-full bg-[#0e0e0e] border-none rounded-lg py-4 pl-4 pr-12 text-[#e5e2e1] placeholder:text-zinc-700 focus:ring-1 focus:ring-[#d1bcff]/30 transition-all outline-none font-mono text-sm"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#d1bcff] transition-colors text-xl">
                  person
                </span>
              </div>
            </div>

            {/*Email*/}
            <div className="space-y-1.5">
              <label className="text-[#ccc3d7] text-[10px] uppercase font-bold tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ACCESS@VAULT.COM"
                  className="w-full bg-[#0e0e0e] border-none rounded-lg py-4 pl-4 pr-12 text-[#e5e2e1] placeholder:text-zinc-700 focus:ring-1 focus:ring-[#d1bcff]/30 transition-all outline-none font-mono text-sm"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#d1bcff] transition-colors text-xl">
                  alternate_email
                </span>
              </div>
            </div>

            {/*Password*/}
            <div className="space-y-1.5">
              <label className="text-[#ccc3d7] text-[10px] uppercase font-bold tracking-widest ml-1">
                Encryption Key
              </label>
              <div className="relative group">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0e0e0e] border-none rounded-lg py-4 pl-4 pr-12 text-[#e5e2e1] placeholder:text-zinc-700 focus:ring-1 focus:ring-[#d1bcff]/30 transition-all outline-none font-mono text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-[#d1bcff] transition-colors">
                  <span className="material-symbols-outlined text-xl">
                    {showPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/*Submit*/}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#d1bcff] to-[#a277ff] text-[#3d0090] font-headline font-bold py-4 rounded-lg uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(162,119,255,0.2)] mt-4 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/*Footer link*/}
          <div className="mt-8 text-center">
            <p className="text-[#ccc3d7] text-xs">
              ALREADY HAVE AN ACCOUNT?{" "}
              <Link to="/login"
                className="text-[#d1bcff] font-bold hover:underline ml-1 underline-offset-4 decoration-[#d1bcff]/30">
                LOGIN
              </Link>
            </p>
          </div>
        </div>

        {/*Security badge*/}
        <div className="mt-8 flex justify-center items-center gap-4 opacity-40">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">shield</span>
            <span className="text-[10px] font-label tracking-tighter">JWT Protected</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#4a4454]" />
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-[10px] font-label tracking-tighter">OAuth 2.0</span>
          </div>
        </div>
      </main>

      {/*Footer*/}
      <footer className="fixed bottom-0 w-full flex justify-center pb-10 z-50">
        <div className="flex gap-8 items-center text-zinc-600 text-xs tracking-widest uppercase">
          {["Privacy", "Terms", "Security"].map(item => (
            <span key={item}
              className="opacity-80 hover:opacity-100 hover:text-[#d1bcff] transition-all cursor-pointer">
              {item}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
