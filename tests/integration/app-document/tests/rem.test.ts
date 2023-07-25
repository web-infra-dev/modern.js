import fs from 'fs';
import path from 'path';

import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('test build', () => {
  beforeAll(async () => {
    await modernBuild(appDir, ['-c', 'modern-rem.config.ts']);
  });

  test('should add rem resource correct', async () => {
    const htmlNoDoc = fs.readFileSync(
      path.join(appDir, 'dist-1', 'html/test/index.html'),
      'utf-8',
    );
    expect(htmlNoDoc.includes('/static/js/convert-rem.'));
  });
});
