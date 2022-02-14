import os from 'os';
import chalk from 'chalk';
import { isDev } from './is';

// TODO: type
interface EntryPoint {
  entryName: string;
}

interface ServerRoute {
  entryName: string;
  isSSR: boolean;
  urlPath: string;
}

// TODO: remove hard code 'main'
export const isSingleEntry = (entrypoints: EntryPoint[]) =>
  entrypoints.length === 1 && entrypoints[0].entryName === 'main';

const normalizeUrl = (url: string) => url.replace(/([^:]\/)\/+/g, '$1');

const getAddressUrls = (protocol = 'http', port: number) => {
  const interfaces = os.networkInterfaces();
  const ipv4Interfaces: os.NetworkInterfaceInfo[] = [];
  Object.keys(interfaces).forEach(key => {
    interfaces[key]!.forEach(detail => {
      if (detail.family === 'IPv4') {
        ipv4Interfaces.push(detail);
      }
    });
  });

  return ipv4Interfaces.reduce(
    (memo: { type: string; url: string }[], detail) => {
      let type = 'Network:  ';
      let url = `${protocol}://${detail.address}:${port}`;
      if (detail.address.includes(`localhost`)) {
        type = 'Local:  ';
        url = `${protocol}://localhost:${port}`;
      }

      memo.push({ type, url });
      return memo;
    },
    [],
  );
};

export const prettyInstructions = (appContext: any, config: any) => {
  const { entrypoints, serverRoutes, port, existSrc, checkedEntries } =
    appContext as {
      entrypoints: EntryPoint[];
      serverRoutes: ServerRoute[];
      port: number;
      existSrc: boolean;
      checkedEntries: string[];
    };

  const urls = getAddressUrls(
    config.dev.https && isDev() ? 'https' : 'http',
    port,
  );

  const routes = existSrc
    ? serverRoutes.filter(route => route.entryName)
    : serverRoutes;

  let message = 'App running at:\n\n';

  if (isSingleEntry(entrypoints) || !existSrc) {
    message += urls
      .map(
        ({ type, url }) =>
          `  ${chalk.bold(`> ${type.padEnd(10)}`)}${chalk.cyanBright(
            normalizeUrl(`${url}/${routes[0].urlPath}`),
          )}\n`,
      )
      .join('');
  } else {
    const maxNameLength = Math.max(...routes.map(r => r.entryName.length));

    urls.forEach(({ type, url }) => {
      message += `  ${chalk.bold(`> ${type}`)}\n`;
      routes.forEach(({ entryName, urlPath, isSSR }) => {
        if (!checkedEntries.includes(entryName)) {
          return;
        }

        message += `    ${chalk.yellowBright(
          isSSR ? 'λ' : '○',
        )}  ${chalk.yellowBright(
          entryName.padEnd(maxNameLength + 8),
        )}${chalk.cyanBright(normalizeUrl(`${url}/${urlPath}`))}\n`;
      });
    });

    message += '\n';
    message += chalk.cyanBright(
      '  λ (Server) server-side renders at runtime\n',
    );
    message += chalk.cyanBright(
      '  ○ (Static) client-side rendered as static HTML\n',
    );
  }

  return message;
};
