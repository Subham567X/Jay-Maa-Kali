import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kali: {
          darkest: "#05060f",
          dark: "#0b0c1e",
          card: "#12142d",
          cardBorder: "#2a2347",
          crimson: "#880808",
          crimsonBright: "#dc2626",
          gold: "#c5a059",
          goldBright: "#fbbf24",
          goldDark: "#926829",
          flame: "#f97316",
          divineGlow: "#ffd700",
        },
      },
      fontFamily: {
        bengali: ["var(--font-hind-siliguri)", "sans-serif"],
        devotional: ["var(--font-noto-bengali)", "serif"],
      },
      animation: {
        flicker: "flicker 2.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite alternate",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.82", transform: "scale(0.97)" },
          "75%": { opacity: "0.95", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%": { filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))" },
          "100%": { filter: "drop-shadow(0 0 20px rgba(239, 68, 68, 0.7))" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
