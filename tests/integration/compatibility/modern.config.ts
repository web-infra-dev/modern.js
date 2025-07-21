import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  output: {
    sourceMap: false,
    filenameHash: false,
  },
  security: {
    checkSyntax: {
      ecmaVersion: 5,
    },
  },
});
