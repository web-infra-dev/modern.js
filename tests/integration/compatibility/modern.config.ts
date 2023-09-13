import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  output: {
    disableSourceMap: true,
    disableFilenameHash: true,
  },
  security: {
    checkSyntax: {
      ecmaVersion: 5,
    },
  },
});
