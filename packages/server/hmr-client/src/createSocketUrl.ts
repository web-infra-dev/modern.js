import url from 'url';
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

function getSocketUrl(urlParts: ParsedSearch, location: Location) {
  const { host, port, path, protocol } = urlParts;

  return url.format({
    protocol: protocol || location.protocol === 'https:' ? 'wss' : 'ws',
    hostname: host || location.hostname,
    port: port || location.port,
    pathname: path || HMR_SOCK_PATH,
    slashes: true,
  });
}
