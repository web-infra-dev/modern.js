import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 2 });

describe('test transformImport type', () => {
  let buildRes: { code: number };
  beforeAll(async () => {
    buildRes = await modernBuild(appDir);
  });

  test(`should build`, async () => {
    expect(buildRes.code).toBe(0);
  });
});
