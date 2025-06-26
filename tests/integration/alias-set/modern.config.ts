import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  resolve: {
    alias: {
      '@resolve-alias': path.resolve(__dirname, 'src/alias'),
    },
  },
});
