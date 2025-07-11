import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

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
