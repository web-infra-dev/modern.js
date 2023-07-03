import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssMaps } from './utils';

describe('disablecss source map', () => {
  test(`shouldn't generate source map`, async () => {
    const appDir = path.resolve(fixtures, 'disable-source-map');

    await modernBuild(appDir);

    const cssMaps = getCssMaps(appDir);

    expect(cssMaps.length).toBe(0);
  });
});
