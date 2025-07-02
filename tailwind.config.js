/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#28377F',
        secondary: '#F59E0B',
        accent: '#10B981',
      }
    },
  },
  plugins: [],
}