import { tailwindcssPlugin } from '@modern-js/plugin-tailwindcss';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  plugins: [tailwindcssPlugin()],
});
