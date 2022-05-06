import { Server } from '@modern-js/server';
import {
  closeServer,
  createServer,
  getServer,
} from '../src/utils/createServer';
import { getSpecifiedEntries } from '../src/utils/getSpecifiedEntries';
import { safeReplacer } from '../src/utils/config';

jest.mock('@modern-js/utils', () => ({
  __esModule: true,
  ...jest.requireActual('@modern-js/utils'),
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
    const checked = await getSpecifiedEntries(false, [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any);

    expect(checked).toEqual(['a', 'b']);
  });

  it('should return spec entry', async () => {
    const checked = await getSpecifiedEntries(['a'], [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any);

    expect(checked).toEqual(['a']);
  });

  it('should return select entry', async () => {
    const checked = await getSpecifiedEntries(true, [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any);

    expect(checked).toEqual(['b']);
  });

  it('should get error if entry not allow', resolve => {
    getSpecifiedEntries(['c'], [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any).catch(e => {
      expect((e as Error).message).toMatch('can not found entry c');
      resolve();
    });
  });

  it('should create and close server correctly', async () => {
    const app = await createServer({
      dev: false,
      pwd: '.',
      config: {
        output: {
          path: 'dist',
        },
      },
    } as any);

    expect(app instanceof Server).toBe(true);
    expect(getServer()).toBe(app);

    await closeServer();
    expect(getServer()).toBeNull();
  });

  it('safeReplacer should handle circular object', () => {
    const a: {
      [key: string]: unknown;
    } = {
      name: 'a',
    };

    const b: {
      [key: string]: unknown;
    } = {
      name: 'b',
    };

    a.b = b;
    b.a = a;

    const res1 = JSON.stringify(a, safeReplacer());
    expect(res1).toMatchSnapshot();

    const c: {
      [key: string]: unknown;
    } = {
      name: 'c',
    };

    const d: {
      [key: string]: unknown;
    } = {
      name: 'd',
    };

    const e: {
      [key: string]: unknown;
    } = {
      name: 'e',
    };

    c.d = d;
    d.e = e;
    e.c = c;

    const res2 = JSON.stringify(c, safeReplacer());
    expect(res2).toMatchSnapshot();
  });
});
