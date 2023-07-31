import os from 'os';
import { chalk } from '../compiled';
import { isDev, isSingleEntry } from './is';
import { DEFAULT_DEV_HOST } from './constants';

// TODO: type
interface EntryPoint {
  entryName: string;
}

interface ServerRoute {
  entryName: string;
  isSSR: boolean;
  urlPath: string;
}

const normalizeUrl = (url: string) => url.replace(/([^:]\/)\/+/g, '$1');

const getIpv4Interfaces = () => {
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

export type AddressUrl = { label: string; url: string };

export const getAddressUrls = (
  protocol = 'http',
  port: number,
  host?: string,
) => {
  const LOCAL_LABEL = 'Local:  ';
  const NETWORK_LABEL = 'Network:  ';
  const isLocalhost = (url: string) => url?.includes('localhost');

  if (host && host !== DEFAULT_DEV_HOST) {
    return [
      {
        label: isLocalhost(host) ? LOCAL_LABEL : NETWORK_LABEL,
        url: `${protocol}://${host}:${port}`,
      },
    ];
  }

  const ipv4Interfaces = getIpv4Interfaces();

  return ipv4Interfaces.reduce((memo: AddressUrl[], detail) => {
    if (isLocalhost(detail.address) || detail.internal) {
      memo.push({
        label: LOCAL_LABEL,
        url: `${protocol}://localhost:${port}`,
      });
    } else {
      memo.push({
        label: NETWORK_LABEL,
        url: `${protocol}://${detail.address}:${port}`,
      });
    }
    return memo;
  }, []);
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

  const isHttps = isDev() && appContext.builder?.context.devServer?.https;

  const urls = getAddressUrls(
    isHttps ? 'https' : 'http',
    port,
    config.dev?.host,
  );

  const routes = !apiOnly
    ? serverRoutes.filter(route => route.entryName)
    : serverRoutes;

  let message = 'App running at:\n\n';

  if (isSingleEntry(entrypoints, config.source?.mainEntryName) || apiOnly) {
    message += urls
      .map(
        ({ label, url }) =>
          `  ${chalk.bold(`> ${label.padEnd(10)}`)}${chalk.cyanBright(
            normalizeUrl(`${url}/${routes[0].urlPath}`),
          )}\n`,
      )
      .join('');
  } else {
    const maxNameLength = Math.max(...routes.map(r => r.entryName.length));

    urls.forEach(({ label, url }) => {
      message += `  ${chalk.bold(`> ${label}`)}${
        routes.length === 0 ? chalk.cyanBright(url) : ''
      }\n`;
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
