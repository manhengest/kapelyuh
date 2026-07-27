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
        disabledBtn: '#D9D2CE',
        disabledText: '#8C8078',
        pickerSurface: '#F6EFE8',
        pickerBorder: '#CDB7B7',
        awardSelected: '#FFF3CD',
        round1: '#FF6B9D',
        round2: '#2EC4B6',
        round3: '#C8E62E',
      },
    },
  },
  plugins: [],
};
