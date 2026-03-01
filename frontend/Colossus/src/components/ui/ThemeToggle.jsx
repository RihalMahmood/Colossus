import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 ${
        isDark
          ? "border-white/10 text-white/40 hover:text-white hover:bg-white/5"
          : "border-rose-200 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
      }`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
