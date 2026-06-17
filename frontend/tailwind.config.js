/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Source Serif 4 — the brand's official display/headings face.
        display: ['"Source Serif 4"', 'Georgia', 'ui-serif', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        // Geist Mono — HUD / telemetry readouts only (instrument chrome on the marketing world)
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.5rem, 1.8rem + 2.8vw, 3.5rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        title:   ['1.5rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        label:   ['0.6875rem', { lineHeight: '1', letterSpacing: '0.09em' }],
      },
      colors: {
        // ── Dark navy — sidebar / nav rail (brand Navy #0F2230) ──
        civic: {
          surface: "#0f2230",   // sidebar bg
          panel:   "#173241",    // raised navy
          line:    "#24414f",    // navy borders
          raise:   "#1d3a49",    // navy hover
          text:    "#f3eadc",    // cream text on navy
          muted:   "#9fb0b8",    // muted text on navy
          teal:     "#d65a29",   // brand Orange (token name kept)
          orangelt: "#e2703f",
          amber:    "#d99a3c",
          rose:     "#ee6c7a",
          sage:     "#5f8c6e",
          slate:    "#546d78",
          "slate-text": "#8fa7b0",
          blue:     "#71a7ff",
        },
        // ── Cream / paper — the working content surface ──
        paper: {
          DEFAULT: "#f4ecdb",   // content background (warm cream)
          card:    "#fcf9f2",    // cards (warm near-white)
          line:    "#e7dcc7",    // hairline borders on cream
          raise:   "#efe6d4",    // hover on cream
        },
        // Ink — text on cream
        ink: {
          DEFAULT: "#15242f",   // headings / numbers (navy)
          soft:    "#505962",    // body / secondary (≥7:1 on cream)
          faint:   "#6f6657",    // small labels — darkened to clear AA (≥4.5:1 on card)
        },
        // Accent + semantic (brand)
        orange: { DEFAULT: "#d65a29", ink: "#a8481c" }, // .ink = readable on cream
        gold:   { DEFAULT: "#cf9c46", ink: "#8f6a23" },
        sage:   { DEFAULT: "#4f8a5b", ink: "#3d7048" },
        rose:   { DEFAULT: "#d6452f", ink: "#b23a2c" },
        slatec: { DEFAULT: "#54707d", ink: "#3f5560" },
        bluec:  { DEFAULT: "#3f74c4", ink: "#2a5aa8" },
      },
      boxShadow: {
        panel: "0 18px 48px rgba(0, 0, 0, 0.32)",
        card:  "0 1px 2px rgba(21,36,47,0.04), 0 10px 24px -16px rgba(21,36,47,0.18)",
        glow:  "0 8px 28px -8px rgba(214,90,41,0.45)",
      },
    },
  },
  plugins: [],
};
