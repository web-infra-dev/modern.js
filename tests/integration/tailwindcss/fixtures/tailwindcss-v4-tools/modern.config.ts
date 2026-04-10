import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  tools: {
    postcss(_, { addPlugins }) {
      addPlugins([require('@tailwindcss/postcss')]);
    },
  },
  plugins: [],
});
