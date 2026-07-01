/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "#15181d",
        border: "#252a32",
        text: "#e6e8eb",
        muted: "#8a93a0",
        accent: "#7cb7ff",
        accent2: "#9d7bff",
        danger: "#ff7a8a",
        ok: "#7be0a1",
        warn: "#ffd480",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        mono: ["Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
