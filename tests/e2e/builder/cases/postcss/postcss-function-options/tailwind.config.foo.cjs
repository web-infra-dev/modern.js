const path = require('node:path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, './src/foo/**/*.{html,js,ts,jsx,tsx}')],
  theme: {
    extend: {},
  },
  plugins: [],
};
