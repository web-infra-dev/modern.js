import path from 'node:path';
import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  source: {
    alias: {
      '@my-src': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [bffPlugin()],
  output: {
    disableTsChecker: true, // 关闭 TypeScript 类型检查
  },
});
