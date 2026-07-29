/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101820",
        surface: "#F7F8FA",
        panel: "#FFFFFF",
        line: "#E3E6EA",
        accent: "#2454FF",
        accentDark: "#173BBF",
        good: "#1E8E5A",
        warn: "#C4551A",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}

