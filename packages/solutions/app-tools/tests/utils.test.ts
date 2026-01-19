import * as utils from '@modern-js/utils' with { rstest: 'importActual' };
import { getSelectedEntries } from '../src/utils/getSelectedEntries';

rstest.mock('@modern-js/utils', () => ({
  __esModule: true,
  ...utils,
  inquirer: {
    prompt() {
      return {
        selected: ['b'],
      };
    },
  },
}));

describe('test app-tools utils', () => {
  it('should return all entryNames correctly', async () => {
    const checked = await getSelectedEntries(false, [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any);

    expect(checked).toEqual(['a', 'b']);
  });

  it('should return spec entry', async () => {
    const checked = await getSelectedEntries(['a'], [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any);

    expect(checked).toEqual(['a']);
  });

  it('should return select entry', async () => {
    const checked = await getSelectedEntries(true, [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any);

    expect(checked).toEqual(['b']);
  });

  it('should get error if entry not allow', async () => {
    await getSelectedEntries(['c'], [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any).catch(e => {
      expect((e as Error).message).toMatch(
        `Can not found entry ${utils.chalk.yellow('c')}`,
      );
    });
  });
});
