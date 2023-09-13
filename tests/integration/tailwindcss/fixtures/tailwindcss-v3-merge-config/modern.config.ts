import { tailwindcssPlugin } from '@modern-js/plugin-tailwindcss';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  plugins: [tailwindcssPlugin()],
  tools: {
    tailwindcss: {
      theme: {
        colors: {
          'red-500': 'green',
        },
      },
    },
  },
});
