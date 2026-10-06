module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        panel: "#0d1a2b",
        line: "#223149",
        electric: "#37d5ff",
        violet: "#8b7cff",
        mint: "#40e0a1",
      },
      boxShadow: {
        glow: "0 0 40px rgba(55, 213, 255, 0.10)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

