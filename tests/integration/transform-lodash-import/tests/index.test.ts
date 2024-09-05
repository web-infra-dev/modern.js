import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('test both source.transformImport and performance.transformLodash to handle lodash', () => {
  let buildRes: { stdout: string };
  beforeAll(async () => {
    buildRes = await modernBuild(appDir);
  });

  test(`should build`, async () => {
    expect(buildRes.stdout).toContain(
      'warn    Detected a potential conflict between `source.transformImport` and `performance.transformLodash` for lodash. Please ensure only one of these configurations is used to handle lodash imports. If you want to use `source.transformImport`, set `performance.transformLodash` to `false` in your configuration.\n',
    );
  });
});
