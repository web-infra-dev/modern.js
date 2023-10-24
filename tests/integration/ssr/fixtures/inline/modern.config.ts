import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

process.env.BUNDLER = 'webpack';
export default applyBaseConfig({
  server: {
    ssr: true,
  },
  output: {
    enableInlineStyles: true,
    enableInlineScripts: /page\./,
  },
  runtime: {
    router: true,
  },
});
