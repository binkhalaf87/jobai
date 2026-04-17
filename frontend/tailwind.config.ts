import type { Config } from "tailwindcss";

// This config keeps the styling surface intentionally small until the design system is defined.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce7ff",
          200: "#b8d0ff",
          300: "#8aa8ff",
          400: "#5b7fff",
          500: "#3f7ad8",
          600: "#2f5cc1",
          700: "#1f4594",
          800: "#152e68",
          900: "#0e234a"
        },
        tech: {
          DEFAULT: "#8C5CF7",
          light: "#E8D8FF"
        },
        mint: {
          DEFAULT: "#34C38F",
          light: "#DBF8F0"
        }
      },
      boxShadow: {
        soft: "0 28px 80px -42px rgba(15, 23, 42, 0.25)",
        panel: "0 18px 50px -24px rgba(15, 23, 42, 0.18)"
      },
      fontFamily: {
        sans: ["Inter", "Noto Kufi Arabic", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

