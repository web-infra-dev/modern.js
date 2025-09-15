import { tailwindcssPlugin } from '@modern-js/plugin-tailwindcss';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  tools: {
    tailwindcss: {
      theme: {
        colors: {
          gray: 'red',
        },
      },
    },
  },
  plugins: [tailwindcssPlugin()],
});
