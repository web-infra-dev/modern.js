import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('test temp-dir', () => {
  let buildRes: { code: number };
  beforeAll(async () => {
    buildRes = await modernBuild(appDir);
  });

  test(`should build`, async () => {
    expect(buildRes.code === 0).toBe(true);
  });
});
