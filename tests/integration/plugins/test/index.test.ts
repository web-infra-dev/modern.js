import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('plugins order build', () => {
  test(`should get right plugins order`, async () => {
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code === 0).toBe(true);
    expect(buildRes.stdout).toContain(
      `run plugin Custom
run plugin Modern
run plugin Inner
`,
    );
  });
});
