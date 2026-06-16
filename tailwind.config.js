/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        round1: '#FF6B9D',
        round2: '#2EC4B6',
        round3: '#C8E62E',
      },
    },
  },
  plugins: [],
};
