/** @type {import('tailwindcss').Config} */
export default {
  //Enable class-based dark mode (html class="dark")
  darkMode: "class",

  //Scan all JSX/JS files for class names
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      //Colossus Material Design colour tokens
      colors: {
        //Surfaces
        "surface":                    "#131313",
        "surface-dim":                "#131313",
        "surface-bright":             "#3a3939",
        "surface-container-lowest":   "#0e0e0e",
        "surface-container-low":      "#1c1b1b",
        "surface-container":          "#201f1f",
        "surface-container-high":     "#2a2a2a",
        "surface-container-highest":  "#353534",
        "surface-variant":            "#353534",
        "surface-tint":               "#d1bcff",
        "background":                 "#131313",

        //On-surface
        "on-surface":         "#e5e2e1",
        "on-surface-variant": "#ccc3d7",
        "on-background":      "#e5e2e1",

        //Primary (purple)
        "primary":                  "#d1bcff",
        "primary-container":        "#a277ff",
        "primary-fixed":            "#eaddff",
        "primary-fixed-dim":        "#d1bcff",
        "on-primary":               "#3d0090",
        "on-primary-container":     "#35007f",
        "on-primary-fixed":         "#24005b",
        "on-primary-fixed-variant": "#5714be",
        "inverse-primary":          "#6f39d7",

        //Secondary (green)
        "secondary":                    "#4edea3",
        "secondary-container":          "#00a572",
        "secondary-fixed":              "#6ffbbe",
        "secondary-fixed-dim":          "#4edea3",
        "on-secondary":                 "#003824",
        "on-secondary-container":       "#00311f",
        "on-secondary-fixed":           "#002113",
        "on-secondary-fixed-variant":   "#005236",

        //Tertiary (amber)
        "tertiary":                     "#f6bc75",
        "tertiary-container":           "#ba8745",
        "tertiary-fixed":               "#ffddb8",
        "tertiary-fixed-dim":           "#f6bc75",
        "on-tertiary":                  "#472a00",
        "on-tertiary-container":        "#3e2400",
        "on-tertiary-fixed":            "#2a1700",
        "on-tertiary-fixed-variant":    "#653e00",

        //Error
        "error":               "#ffb4ab",
        "error-container":     "#93000a",
        "on-error":            "#690005",
        "on-error-container":  "#ffdad6",

        //Misc
        "outline":            "#958ea0",
        "outline-variant":    "#4a4454",
        "inverse-surface":    "#e5e2e1",
        "inverse-on-surface": "#313030",
      },

      //Border radius
      borderRadius: {
        DEFAULT: "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        full:    "9999px",
      },

      //Font families
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        mono:     ["JetBrains Mono", "Berkeley Mono", "monospace"],
      },
    },
  },

  plugins: [],
};
