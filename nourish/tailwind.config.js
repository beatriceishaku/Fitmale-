/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F2",
        lilac: {
          50: "#F6F1FA",
          100: "#EBE0F5",
          200: "#D9C6EC",
          300: "#C3A6E0",
          400: "#AB86D2",
          500: "#8F63BD",
        },
        blush: {
          50: "#FDF1F1",
          100: "#FADDDE",
          200: "#F5BEC1",
          300: "#EE9A9F",
          400: "#E27680",
        },
        plum: {
          600: "#5C3A5E",
          700: "#452A47",
          800: "#331F35",
          900: "#251726",
        },
        sage: {
          400: "#8BAA8E",
          500: "#6F9673",
          600: "#557A59",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(69, 42, 71, 0.08)",
        card: "0 2px 12px -2px rgba(69, 42, 71, 0.10)",
      },
    },
  },
  plugins: [],
};
