import type { Config } from "tailwindcss";

/**
 * Kantong Internship — premium finance identity.
 * Warm off-white canvas, deep burgundy→red accent, soft elevation.
 * Tokens are centralised here and mirrored as CSS variables in globals.css.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FEF2F2",
          100: "#FDE3E3",
          200: "#FBCDCD",
          300: "#F5A3A3",
          400: "#EC6F6F",
          500: "#DF4444",
          600: "#C42B2B", // primary — slightly deeper than pure #DC2626, less neon
          700: "#9F1F2B", // burgundy
          800: "#7E1D2B", // deep burgundy
          900: "#641A26",
        },
        ink: {
          DEFAULT: "#1C1917", // warm near-black (stone-900)
          muted: "#78716C", // warm stone-500
          soft: "#A8A29E", // stone-400
        },
        line: "#EBE7E2", // warm, soft border
        "line-strong": "#DED9D3",
        surface: "#FFFFFF",
        canvas: "#F7F5F2", // warm off-white
        sand: "#F1EDE8",
        positive: {
          DEFAULT: "#15803D",
          soft: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#B45309",
          soft: "#FEF3C7",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "30px",
      },
      maxWidth: {
        "8xl": "88rem",
      },
      boxShadow: {
        // softer, warmer elevation — no harsh black shadows
        card: "0 1px 2px rgba(28,25,23,0.04), 0 10px 30px -16px rgba(28,25,23,0.14)",
        "card-hover": "0 2px 6px rgba(28,25,23,0.05), 0 22px 48px -20px rgba(159,31,43,0.22)",
        glow: "0 24px 70px -28px rgba(159,31,43,0.55)",
        soft: "0 1px 3px rgba(28,25,23,0.05)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.5)",
      },
      backgroundImage: {
        // richer burgundy → red, with depth
        "brand-gradient": "linear-gradient(135deg, #7E1D2B 0%, #9F1F2B 45%, #C42B2B 100%)",
        "hero-mesh":
          "radial-gradient(120% 110% at 8% 0%, rgba(225,29,72,0.55) 0%, rgba(225,29,72,0) 45%), radial-gradient(120% 120% at 100% 100%, #C42B2B 0%, #7E1D2B 62%)",
        "brand-glow": "radial-gradient(60% 60% at 50% 0%, rgba(196,43,43,0.16) 0%, rgba(196,43,43,0) 100%)",
        "sheen": "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
