const path = require('node:path');

export default {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, './tailwind.config.cjs'),
    },
  },
};
