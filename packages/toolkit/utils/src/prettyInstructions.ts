import os from 'os';
import { chalk } from './compiled';
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

export const getIpv4Interfaces = () => {
  const interfaces = os.networkInterfaces();
  const ipv4Interfaces: os.NetworkInterfaceInfo[] = [];

  Object.keys(interfaces).forEach(key => {
    interfaces[key]!.forEach(detail => {
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof detail.family === 'string' ? 'IPv4' : 4;

      if (detail.family === familyV4Value) {
        ipv4Interfaces.push(detail);
      }
    });
  });
  return ipv4Interfaces;
};

const getAddressUrls = (protocol = 'http', port: number) => {
  const ipv4Interfaces = getIpv4Interfaces();
  return ipv4Interfaces.reduce(
    (memo: { type: string; url: string }[], detail) => {
      let type = 'Network:  ';
      let url = `${protocol}://${detail.address}:${port}`;
      if (detail.address.includes(`localhost`) || detail.internal) {
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
  const { entrypoints, serverRoutes, port, apiOnly, checkedEntries } =
    appContext as {
      entrypoints: EntryPoint[];
      serverRoutes: ServerRoute[];
      port: number;
      apiOnly: boolean;
      checkedEntries: string[];
    };

  const urls = getAddressUrls(
    config.dev.https && isDev() ? 'https' : 'http',
    port,
  );

  const routes = !apiOnly
    ? serverRoutes.filter(route => route.entryName)
    : serverRoutes;

  let message = 'App running at:\n\n';

  if (isSingleEntry(entrypoints) || apiOnly) {
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
      '  ○ (Static) client-side renders as static HTML\n',
    );
  }

  return message;
};
