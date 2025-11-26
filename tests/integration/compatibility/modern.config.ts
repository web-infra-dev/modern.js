import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
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
