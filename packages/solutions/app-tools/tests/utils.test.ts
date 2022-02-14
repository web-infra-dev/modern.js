import inquirer from 'inquirer';
import { Server } from '@modern-js/server';
import {
  closeServer,
  createServer,
  getServer,
} from '../src/utils/createServer';
import { getSpecifiedEntries } from '../src/utils/getSpecifiedEntries';

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
    inquirer.prompt = jest.fn().mockResolvedValue({ selected: ['b'] }) as any;
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
      // eslint-disable-next-line promise/prefer-await-to-then
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
});
