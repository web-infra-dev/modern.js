import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  output: {
    tempDir: path.join('node_modules', '.temp-dir'),
  },
});
