/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./popup.tsx", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#7c3aed",
          light: "#a78bfa",
          dark: "#5b21b6",
        },
      },
    },
  },
  plugins: [],
}
