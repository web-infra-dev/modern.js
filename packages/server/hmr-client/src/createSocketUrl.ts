import { HMR_SOCK_PATH } from '@modern-js/utils/constants';

type ParsedSearch = {
  host: string;
  port: string;
  path: string;
  protocol?: string;
};

export function createSocketUrl(resourceQuery: string) {
  // ?host=localhost&port=8080&path=modern_js_hmr_ws
  const searchParams = resourceQuery.substr(1).split('&');
  const options: Record<string, string> = {};

  for (const pair of searchParams) {
    const ary = pair.split('=');
    options[ary[0]] = decodeURIComponent(ary[1]);
  }

  const currentLocation = self.location;

  return getSocketUrl(options as ParsedSearch, currentLocation);
}

export function formatURL({
  port,
  protocol,
  hostname,
  pathname,
}: {
  port: string;
  protocol: string;
  hostname: string;
  pathname: string;
}) {
  if (window.URL) {
    const url = new URL('http://localhost');
    url.port = port;
    url.hostname = hostname;
    url.protocol = protocol;
    url.pathname = pathname;
    return url.toString();
  }

  // compatible with IE11
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}`;
}

function getSocketUrl(urlParts: ParsedSearch, location: Location) {
  const { host, port, path, protocol } = urlParts;

  return formatURL({
    protocol: protocol || location.protocol === 'https:' ? 'wss' : 'ws',
    hostname: host || location.hostname,
    port: port || location.port,
    pathname: path || HMR_SOCK_PATH,
  });
}
