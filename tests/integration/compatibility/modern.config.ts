import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  output: {
    disableSourceMap: true,
    filenameHash: false,
  },
  security: {
    checkSyntax: {
      ecmaVersion: 5,
    },
  },
});
