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
        // Re-themed "emerald" scale becomes a deep moss/forest green (lichen-on-granite,
        // alpine-forest) so every existing bg/text/border-emerald-* utility instantly
        // reskins app-wide without touching each component.
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          900: '#14532d',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          900: '#14532d',
        },
        chalk: '#f8fafc',
        rock: {
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
