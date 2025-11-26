import { styledComponentsPlugin } from '@modern-js/plugin-styled-components';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  plugins: [
    styledComponentsPlugin({
      minify: process.env.NODE_ENV === 'production',
      namespace: 'my-styled-components',
    }),
  ],
});
