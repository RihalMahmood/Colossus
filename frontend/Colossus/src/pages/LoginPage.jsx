import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cloud, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ui/ThemeToggle";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    //e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      toast.success(res.message || "Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      console.log(err);   //For debugging
      toast.error(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const t = isDark
    ? { text: "text-white", textMuted: "text-white/40", textSub: "text-white/60", card: "glass-card-dark", input: "input-glass-dark", btn: "btn-glow-dark", link: "text-purple-400 hover:text-purple-300", iconColor: "text-white/30", eyeColor: "text-white/30 hover:text-white/60" }
    : { text: "text-gray-900", textMuted: "text-gray-400", textSub: "text-gray-500", card: "glass-card-light", input: "input-glass-light", btn: "btn-glow-light", link: "text-[#8b5cf6] hover:text-[#a78bfa]", iconColor: "text-gray-400", eyeColor: "text-gray-400 hover:text-gray-500" };

  return (
    <div className="relative min-h-screen flex items-center justify-center font-body">
      <div className="absolute top-6 right-8"><ThemeToggle /></div>

      <div className="w-full max-w-md px-4 animate-slide-up">
        {/*Logo*/}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDark ?
            "bg-gradient-to-br from-purple-500 to-violet-700" :
            "bg-gradient-to-br from-[#b89ef8] to-[#cab9fa]"
            }`}>
            <Cloud size={24} className="text-white" />
          </div>
          <h1 className={`font-display text-3xl font-bold ${t.text}`}>Welcome back</h1>
          <p className={`mt-1 font-body ${t.textMuted}`}>Sign in to your Colossus account</p>
        </div>

        <div className={t.card + " p-8"}>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-5">
            {/*Email*/}
            <div>
              <label className={`block text-sm font-medium mb-2 ${t.textSub}`}>Email</label>
              <div className="relative">
                <Mail size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.iconColor}`} />
                <input
                  type="email"
                  placeholder="rihal@example.com"
                  className={`${t.input} pl-11`}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/*Password*/}
            <div>
              <label className={`block text-sm font-medium mb-2 ${t.textSub}`}>Password</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.iconColor}`} />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className={`${t.input} pl-11 pr-12`}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${t.eyeColor}`}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={`${t.btn} w-full mt-2`} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Sign in"}
            </button>
          </form>

          <p className={`text-center text-sm mt-6 font-body ${t.textMuted}`}>
            Don't have an account?{" "}
            <Link to="/register" className={`font-medium transition-colors ${t.link}`}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
