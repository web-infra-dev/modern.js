/**
 * @jest-environment node
 */
import path from 'path';
import { hasLoader, hasAction } from '../../src/router/cli/code/utils';

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
