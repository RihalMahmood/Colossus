import daisyui from "daisyui";

/**@type {import('tailwindcss').Config}*/
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          purple: "#63e",
          glow: "#a855f7",
          dark: "#0a0a0a",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        colossus: {
          primary: "#6633ee",
          "primary-content": "#ffffff",
          secondary: "#a855f7",
          "secondary-content": "#ffffff",
          accent: "#06b6d4",
          "accent-content": "#ffffff",
          neutral: "#1a1a2e",
          "neutral-content": "#e2e8f0",
          "base-100": "#0a0a0f",
          "base-200": "#111118",
          "base-300": "#1a1a25",
          "base-content": "#e2e8f0",
          info: "#38bdf8",
          success: "#34d399",
          warning: "#fbbf24",
          error: "#f87171",
        },
      },
    ],
  },
};
