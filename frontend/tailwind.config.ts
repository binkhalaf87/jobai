import type { Config } from "tailwindcss";

// This config keeps the styling surface intentionally small until the design system is defined.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;

