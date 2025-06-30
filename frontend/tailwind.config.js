/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2D3748", // Deep slate for headers and buttons
        secondary: "#FF6B6B", // Coral for accents and highlights
        accent: "#48BB78", // Emerald green for success states
        background: "#F7FAFC", // Light gray-blue for background
        card: "#FFFFFF", // White for cards
        text: "#4A5568", // Dark gray for text
        muted: "#A0AEC0", // Muted gray for secondary text
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"], // Modern, user-friendly font
      },
    },
  },
  plugins: [],
}
