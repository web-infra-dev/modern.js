import { writeFileSync } from 'fs';
import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  dev: {
    assetPrefix: true,
  },
  plugins: [
    {
      name: 'test-static-file',
      setup(api) {
        api.onDevCompileDone(async () => {
          writeFileSync(
            path.resolve(
              __dirname,
              api.getAppContext().distDirectory,
              'static',
              'test.js',
            ),
            'console.log("test")',
          );
        });
      },
    },
  ],
  output: {
    // assetPrefix: '/my-prefix',
  },
  splitChunks: false,
});
