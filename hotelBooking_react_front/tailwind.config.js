/** @type {import('tailwindcss').Config} */
const Nth =  require('tailwindcss-nth-child');
const plugin = new Nth('n','n+1')

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        'plus': "url('/src/pages/images/plus.png')",
      }
    }
  },
  variants: {
    extend: {
      paddingTop: ['nth-child'],
    },
  },
  plugins: [
    plugin.nthChild()
  ],
}
