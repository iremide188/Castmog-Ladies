/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        castmog: {
          green: "#15803d",
          deep: "#14532d",
          yellow: "#f5b301",
          charcoal: "#171717",
          soft: "#f6f8f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
