import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#D9A441",
          50: "#FBF3E3",
          100: "#F7E7C7",
          200: "#F0D18F",
          300: "#E9BB57",
          400: "#E0AB49",
          500: "#D9A441",
          600: "#B9862F",
          700: "#8F6624",
          800: "#654719",
          900: "#3B290F",
        },
        oil: {
          DEFAULT: "#F4C542",
          light: "#FAE29B",
        },
        emerald: {
          DEFAULT: "#1F8A5B",
          dark: "#146B4A",
          50: "#E7F5EE",
          100: "#C7E8D6",
          600: "#1F8A5B",
          700: "#146B4A",
          800: "#0E5038",
        },
        navy: {
          DEFAULT: "#17324D",
          50: "#EAF0F5",
          100: "#CBDAE6",
          200: "#AEC7DA",
          300: "#93A9C2",
          400: "#7189A3",
          500: "#546D87",
          600: "#3C566E",
          700: "#1F4463",
          800: "#17324D",
          900: "#0F2136",
        },
        surface: {
          bg: "#F7F8FA",
          card: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#D64545",
          50: "#FBEAEA",
          600: "#D64545",
          700: "#B33333",
        },
        warning: {
          DEFAULT: "#E88A25",
          50: "#FDF1E3",
        },
        success: {
          DEFAULT: "#2E9B5F",
          50: "#E9F7EF",
        },
      },
      fontFamily: {
        arabic: ["var(--font-tajawal)", "Tahoma", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(23,50,77,0.06), 0 4px 12px -2px rgba(23,50,77,0.08)",
        "card-hover": "0 2px 4px 0 rgba(23,50,77,0.08), 0 8px 20px -4px rgba(23,50,77,0.12)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "drop-in": {
          "0%": { transform: "translateY(-6px) scale(0.9)", opacity: "0" },
          "60%": { transform: "translateY(1px) scale(1.02)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "drop-in": "drop-in 0.5s cubic-bezier(.34,1.56,.64,1)",
      },
    },
  },
  plugins: [],
};

export default config;
