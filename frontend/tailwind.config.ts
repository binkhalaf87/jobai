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
          50: "#EEF2F9",
          100: "#D0DDF0",
          200: "#A2BCE1",
          300: "#7098CE",
          400: "#4474BA",
          500: "#2057A6",
          600: "#1A468C",
          700: "#143570",
          800: "#0D2355",
          900: "#08183C"
        },
        teal: {
          DEFAULT: "#00A878",
          light: "#CCF0E4"
        },
        mint: {
          DEFAULT: "#00B37E",
          light: "#D4F5EA"
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

