const path = require('node:path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, './src/bar/**/*.{html,js,ts,jsx,tsx}')],
  theme: {
    extend: {},
  },
  plugins: [],
};
