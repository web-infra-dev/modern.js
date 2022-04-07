import net from 'net';
import { chalk } from './compiled';
import { logger } from './logger';

/**
 * Get available free port.
 * @param port - Current port want to use.
 * @param tryLimits - Maximum number of retries.
 * @returns Available port number.
 */
/* eslint-disable no-param-reassign, @typescript-eslint/no-loop-func */
export const getPort = async (
  port: string | number,
  tryLimits = 20,
): Promise<number> => {
  if (typeof port === 'string') {
    port = parseInt(port, 10);
  }

  const original = port;

  let found = false;
  let attempts = 0;
  while (!found && attempts <= tryLimits) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(
          {
            port,
            host: '0.0.0.0',
          },
          () => {
            found = true;
            server.close(resolve);
          },
        );
      });
    } catch (e: any) {
      if (e.code !== 'EADDRINUSE') {
        throw e;
      }
      port++;
      attempts++;
    }
  }

  if (port !== original) {
    logger.info(
      chalk.red(
        `Something is already running on port ${original}. ${chalk.yellow(
          `Use port ${port} instead.`,
        )}`,
      ),
    );
  }

  return port;
};
/* eslint-enable no-param-reassign, @typescript-eslint/no-loop-func */
