/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cloudflare brand colors
        'cf-orange': '#f6821f',
        'cf-orange-dark': '#e27023',
        // Custom financial theme colors
        'finance-green': '#10b981',
        'finance-red': '#ef4444',
        'finance-blue': '#3b82f6',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};
