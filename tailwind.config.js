/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito_400Regular'],
      },
      colors: {
        primaryText: '#401947',
        highlightText: '#960856',
        primaryBtn: '#FDC82B',
        pink: '#FB6694',
        white: '#FEFBF8',
        round1: '#FF6B9D',
        round2: '#2EC4B6',
        round3: '#C8E62E',
      },
    },
  },
  safelist: [
    'btn',
    'btn--primary',
    'btn--secondary',
    'btn--outline',
    'btn--danger',
    'btn--disabled',
    'btn-text',
    'btn-text--primary',
    'btn-text--secondary',
    'btn-text--outline',
    'btn-text--danger',
  ],
  plugins: [],
};
