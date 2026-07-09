import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        "soft-line": "0 1px 0 rgba(15, 23, 42, 0.08), 0 18px 48px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
