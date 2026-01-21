import path from 'path';
import { hasAction, hasLoader } from '../../src/router/cli/code/utils';

describe('should verify loader and action normally', () => {
  const dataFile = path.resolve(
    __dirname,
    './fixtures/nested-routes/user/$.data.ts',
  );

  test('hasLoader', async () => {
    const isExist = await hasLoader(dataFile);
    expect(isExist).toBe(true);
  });

  test('hasAction', async () => {
    const isExist = await hasAction(dataFile);
    expect(isExist).toBe(true);
  });
});
