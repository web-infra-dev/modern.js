import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  output: {
    distPath: {
      root: path.join(__dirname, 'dist/foo'),
    },
  },
});
