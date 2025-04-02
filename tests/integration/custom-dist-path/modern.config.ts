import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  output: {
    distPath: {
      root: path.join(__dirname, 'dist/foo'),
    },
  },
});
