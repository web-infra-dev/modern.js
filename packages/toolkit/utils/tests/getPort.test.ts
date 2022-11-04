import net from 'net';
import { getPort } from '../src/getPort';

describe('get port', () => {
  const originalPort = 45577;

  const listenToPort = async (port: number) => {
    const server = net.createServer();
    server.unref();
    return new Promise<() => void>(resolve => {
      server.listen(
        {
          port,
          host: '0.0.0.0',
        },
        () => {
          resolve(() => {
            server.close();
          });
        },
      );
    });
  };

  test('should get port number correctly', async () => {
    const port = await getPort(originalPort);
    expect(port).toEqual(originalPort);
  });

  test('should increase port number when the port is occupied', async () => {
    const close = await listenToPort(originalPort);
    const port = await getPort(originalPort);
    expect(port).toEqual(originalPort + 1);
    close();
  });

  test('should throw an error when the port is occupied and strictPort is true', async () => {
    const close = await listenToPort(originalPort);

    try {
      await getPort(originalPort, {
        strictPort: true,
      });
    } catch (err) {
      expect((err as Error).message).toEqual(
        `Port "${originalPort}" is occupied, please choose another one.`,
      );
    }
    close();
  });
});
