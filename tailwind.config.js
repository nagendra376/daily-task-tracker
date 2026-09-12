/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        github: {
          dark: '#0d1117',
          darker: '#010409',
          border: '#30363d',
          card: '#161b22',
          text: '#c9d1d9',
          muted: '#8b949e',
          green: '#238636',
          greenHover: '#2ea043',
        }
      }
    },
  },
  plugins: [],
}
