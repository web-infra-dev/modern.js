import path from 'path';
import { getConfigDir } from '../src/features/utils/genConfigDir';

jest.mock('@modern-js/utils', () => {
  const originalModule = jest.requireActual('@modern-js/utils');
  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    fs: {
      ensureDirSync: () => null,
    },
  };
});

describe('base usage', () => {
  it('getConfigDir', () => {
    const appDir = path.join(__dirname, './fixtures/genConfigDir');
    const ret = getConfigDir(appDir);
    expect(ret).toContain(path.join('configs', 'genConfigDir'));
  });
});
