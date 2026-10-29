import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "var(--color-canvas)",
          light: "#FFFFFF",
          dark: "#0F141C",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          light: "#F8FAFC",
          dark: "#161E2E",
        },
        border: {
          DEFAULT: "var(--color-border)",
          light: "#E2E8F0",
          dark: "#243044",
        },
        content: {
          primary: {
            DEFAULT: "var(--color-text-primary)",
            light: "#0F172A",
            dark: "#E2E8F0",
          },
          secondary: {
            DEFAULT: "var(--color-text-secondary)",
            light: "#64748B",
            dark: "#94A3B8",
          },
        },
        brand: {
          primary: "#2563EB",
          "primary-hover": "#1D4ED8",
          online: "#0D9488",
          destructive: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
