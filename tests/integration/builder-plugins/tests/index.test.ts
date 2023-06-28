import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('builder-plugins', () => {
  test(`should allow to register builder plugins`, async () => {
    await modernBuild(appDir);
    const log = readFileSync(path.join(appDir, 'dist/log'), 'utf-8');
    expect(log).toEqual(`before create compiler
before create compiler 2
after create compiler
after create compiler 2
before build
before build 2
after build
after build 2`);
  });
});
