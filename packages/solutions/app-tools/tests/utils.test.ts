import { Server } from 'http';
import net from 'net';
import { chalk } from '@modern-js/utils';
import {
  closeServer,
  createServer,
  getServer,
  restart,
} from '../src/utils/createServer';
import { getSelectedEntries } from '../src/utils/getSelectedEntries';

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

  it('should get error if entry not allow', resolve => {
    getSelectedEntries(['c'], [
      { entryName: 'a' },
      { entryName: 'b' },
    ] as any).catch(e => {
      expect((e as Error).message).toMatch(
        `Can not found entry ${chalk.yellow('c')}`,
      );
      resolve();
    });
  });

  it('should create and close server correctly', async () => {
    const app = await createServer({
      pwd: __dirname,
      config: {
        html: {},
        output: {
          distPath: {
            root: 'dist',
          },
        },
        source: {},
        tools: {},
        server: {},
        runtime: {},
        bff: {},
        dev: {},
        security: {},
      },
      appContext: {},
      dev: {
        port: 3000,
        host: 'localhost',
      },
    });
    app.server.listen(3000);

    expect(app.server instanceof Server).toBe(true);
    const originalServer = getServer();
    expect(originalServer).toBe(app.server);

    await restart();
    const restartedServer = getServer();
    expect(restartedServer).not.toBeNull();
    expect(restartedServer).not.toBe(originalServer);

    const address = restartedServer!.address();
    expect(address).not.toBeNull();
    expect((address as any).port).toBe(3000);

    const isPortListening = await new Promise(resolve => {
      const socket = net
        .connect({ port: 3000 }, () => {
          socket.end();
          resolve(true);
        })
        .on('error', () => resolve(false));
    });
    expect(isPortListening).toBe(true);

    await closeServer();
    expect(getServer()).toBeNull();
  });
});
