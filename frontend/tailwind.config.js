/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        bhavdark: 'rgba(var(--bhavbg-rgb), <alpha-value>)',
        bhavbg: 'rgba(var(--bhavbg-rgb), <alpha-value>)',
        bhavaccent: 'rgba(var(--bhavaccent-rgb), <alpha-value>)',
        bhavtext: 'rgba(var(--bhavtext-rgb), <alpha-value>)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'glow-gradient': 'radial-gradient(circle at center, rgba(197, 160, 89, 0.1) 0%, var(--bhavbg) 70%)',
      }
    },
  },
  plugins: [],
}
