import path from 'path';
import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    asset: {
      path: './asset',
      name: str => {
        if (str.includes('a.png')) {
          return 'b.png';
        }
        return path.basename(str);
      },
    },
    path: './dist/func/bundleless',
  },
});
