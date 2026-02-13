import { type ChildProcess, spawn } from 'child_process';
/* eslint-disable no-control-regex */
import http from 'http';
import path from 'path';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { fs, type Command, fastGlob, getPort, logger } from '@modern-js/utils';
import type { AppTools } from '../types';

const ansiRegex = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*m`, 'g');
const bffPortRegex = /Local:\s+http:\/\/localhost:(\d+)/;
const storybookPortRegex = /http:\/\/localhost:(\d+)/;

type SpawnOptions = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  stdio?: 'inherit';
};

const stripAnsi = (value: string) => value.replace(ansiRegex, '');

const openBrowser = (url: string) => {
  const start =
    process.platform === 'darwin'
      ? '/usr/bin/open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';

  logger.info(`Opening browser: ${start} ${url}`);
  try {
    const child = spawn(start, [url], {
      shell: process.platform === 'win32',
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Failed to open browser: ${err.message}`);
    }
  }
};

let browserOpened = false;

const createProxy = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  target: string,
) => {
  const targetUrl = new URL(target);
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', err => {
    console.error(`Proxy request error: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end('Bad Gateway');
    }
  });

  req.pipe(proxyReq, { end: true });
};

const createWsProxy = (
  req: http.IncomingMessage,
  socket: any,
  head: Buffer,
  target: string,
) => {
  const targetUrl = new URL(target);
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: req.url,
    method: 'GET',
    headers: {
      ...req.headers,
      connection: 'Upgrade',
      upgrade: 'websocket',
    },
  };

  const proxyReq = http.request(options);

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    proxySocket.on('error', err => {
      console.error(`WS Proxy Target Socket error: ${err.message}`);
      socket.end();
    });

    socket.on('error', (err: Error) => {
      console.error(`WS Proxy Client Socket error: ${err.message}`);
      proxySocket.end();
    });

    const headers = [
      `HTTP/1.1 101 Switching Protocols`,
      `Upgrade: websocket`,
      `Connection: Upgrade`,
    ];

    if (proxyRes.headers['sec-websocket-accept']) {
      headers.push(
        `Sec-WebSocket-Accept: ${proxyRes.headers['sec-websocket-accept']}`,
      );
    }
    if (proxyRes.headers['sec-websocket-protocol']) {
      headers.push(
        `Sec-WebSocket-Protocol: ${proxyRes.headers['sec-websocket-protocol']}`,
      );
    }

    socket.write(`${headers.join('\r\n')}\r\n\r\n`);

    if (proxyHead && proxyHead.length > 0) {
      socket.write(proxyHead);
    }

    if (head && head.length > 0) {
      proxySocket.write(head);
    }

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on('error', err => {
    console.error(`WS Proxy error: ${err.message}`);
    socket.end();
  });

  proxyReq.end();
};

const parsePort = (output: string, matcher: RegExp) => {
  const match = stripAnsi(output).match(matcher);
  if (!match) return null;
  const port = Number.parseInt(match[1], 10);
  return Number.isNaN(port) ? null : port;
};

const readPackageJson = async (appDirectory: string) => {
  const pkgPath = path.join(appDirectory, 'package.json');
  if (!(await fs.pathExists(pkgPath))) {
    return null;
  }
  return fs.readJSON(pkgPath);
};

const isStorybookInstalled = async (appDirectory: string) => {
  const pkg = await readPackageJson(appDirectory);
  if (!pkg) return true;
  return Boolean(
    pkg.devDependencies?.storybook ||
      pkg.dependencies?.storybook ||
      pkg.devDependencies?.['@storybook/react'],
  );
};

const hasBffUsage = async (appDirectory: string) => {
  const apiDir = path.join(appDirectory, 'api');
  if (!(await fs.pathExists(apiDir))) {
    return false;
  }

  const files = await fastGlob('src/**/*.{ts,tsx,js,jsx,mjs,cjs}', {
    cwd: appDirectory,
    ignore: ['**/node_modules/**'],
  });

  for (const file of files) {
    const content = await fs.readFile(path.join(appDirectory, file), 'utf-8');
    if (/from\s+['"](@api\/|\.{1,2}\/.*api\/)/.test(content)) {
      return true;
    }
    if (/require\(['"](@api\/|\.{1,2}\/.*api\/)/.test(content)) {
      return true;
    }
  }

  return false;
};

const spawnCommand = (command: string, args: string[], options: SpawnOptions) =>
  spawn(command, args, {
    cwd: options.cwd,
    shell: true,
    env: options.env,
    stdio: options.stdio,
  });

const resolveBffCommand = async (appDirectory: string) => {
  const defaultCommand = { command: 'modern', args: ['dev', '--api-only'] };
  const localModern = path.join(appDirectory, 'node_modules', '.bin', 'modern');
  if (await fs.pathExists(localModern)) {
    return { command: localModern, args: defaultCommand.args };
  }

  return defaultCommand;
};

const handlePortOutput = (
  process: ChildProcess,
  matcher: RegExp,
  onPort: (port: number) => void,
) => {
  process.stdout?.on('data', data => {
    const port = parsePort(data.toString(), matcher);
    if (port !== null) {
      onPort(port);
    }
  });
};

const createProxyServer = (
  proxyPort: number,
  getPorts: () => { bffPort: number | null; storybookPort: number | null },
) =>
  http
    .createServer((req, res) => {
      const { bffPort, storybookPort } = getPorts();
      if (!bffPort || !storybookPort) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('Services starting...');
        return;
      }

      if (req.url?.startsWith('/api')) {
        createProxy(req, res, `http://localhost:${bffPort}`);
      } else {
        createProxy(req, res, `http://localhost:${storybookPort}`);
      }
    })
    .on('upgrade', (req, socket, head) => {
      const { storybookPort } = getPorts();
      if (storybookPort) {
        createWsProxy(req, socket, head, `http://localhost:${storybookPort}`);
      } else {
        socket.end();
      }
    });

export const storybookCommand = async (
  program: Command,
  api: CLIPluginAPI<AppTools>,
) => {
  program
    .command('storybook')
    .description('Start Storybook with BFF proxy support')
    .option('-p, --port <port>', 'Port to run Storybook proxy on', '6006')
    .allowUnknownOption()
    .action(async (options: { port: string }) => {
      const appContext = api.getAppContext();
      const { appDirectory } = appContext;
      const proxyPort = parseInt(options.port || '6006', 10);

      if (!(await isStorybookInstalled(appDirectory))) {
        logger.info(
          'Storybook is not detected in dependencies. Please run `npx storybook@latest init` to install it.',
        );
      }

      const isBffUsed = await hasBffUsage(appDirectory);

      if (!isBffUsed) {
        logger.info('Starting Storybook...');
        spawnCommand('npx', ['storybook', 'dev', ...process.argv.slice(3)], {
          cwd: appDirectory,
          stdio: 'inherit',
        });
        return;
      }

      logger.info('BFF usage detected. Initializing proxy mode...');
      logger.info('Starting BFF Server...');

      const bffCommand = await resolveBffCommand(appDirectory);
      const bffProcess = spawnCommand(bffCommand.command, bffCommand.args, {
        cwd: appDirectory,
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      let bffPort: number | null = null;
      let storybookPort: number | null = null;
      let proxyServer: http.Server | null = null;
      const processes: ChildProcess[] = [bffProcess];

      const cleanup = () => {
        logger.info('Stopping processes...');
        processes.forEach(p => p.kill());
        if (proxyServer) proxyServer.close();
        process.exit();
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      const tryStartProxy = async () => {
        if (!bffPort || !storybookPort || proxyServer) return;

        logger.info(`Starting Proxy Server on port ${proxyPort}...`);

        try {
          const server = createProxyServer(proxyPort, () => ({
            bffPort,
            storybookPort,
          }));
          server.listen(proxyPort, () => {
            const url = `http://localhost:${proxyPort}`;
            logger.success(`Proxy Server Ready at ${url}`);
            logger.info(`- /api/* -> BFF (port ${bffPort})`);
            logger.info(`- *      -> Storybook (port ${storybookPort})`);
            if (!browserOpened) {
              browserOpened = true;
              openBrowser(url);
            }
          });

          proxyServer = server;
        } catch (err) {
          logger.error('Failed to start proxy server', err);
          cleanup();
        }
      };

      const startStorybook = async () => {
        const sbTargetPort = await getPort(proxyPort + 1);

        logger.info(`Starting Storybook on port ${sbTargetPort}...`);

        const sbProcess = spawnCommand(
          'npx',
          ['storybook', 'dev', '-p', sbTargetPort.toString(), '--no-open'],
          {
            cwd: appDirectory,
            env: { ...process.env, FORCE_COLOR: '1' },
          },
        );
        processes.push(sbProcess);

        handlePortOutput(sbProcess, storybookPortRegex, port => {
          if (!storybookPort && port === sbTargetPort) {
            storybookPort = port;
            logger.success(`Storybook ready on port ${storybookPort}`);
            tryStartProxy();
          }
        });

        sbProcess.stderr?.pipe(process.stderr);
      };

      handlePortOutput(bffProcess, bffPortRegex, port => {
        if (!bffPort) {
          bffPort = port;
          logger.success(`BFF Server ready on port ${bffPort}`);
          startStorybook();
        }
      });

      bffProcess.stderr?.pipe(process.stderr);
    });
};
