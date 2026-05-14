/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        civic: {
          surface: "#111315",
          panel: "#181b1f",
          line: "#2b3036",
          text: "#f5f7fa",
          muted: "#a7b0bb",
          teal: "#43d9ad",
          amber: "#f4b860",
          rose: "#ee6c7a",
          blue: "#71a7ff",
        },
      },
      boxShadow: {
        panel: "0 18px 48px rgba(0, 0, 0, 0.24)",
      },
    },
  },
  plugins: [],
};
