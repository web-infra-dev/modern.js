import _ from 'lodash';
import qs from 'query-string';
import { proxy } from 'valtio';
import { setupServerConnection } from '@/rpc';

const { src: dataSource } = qs.parse(location.search);
if (!_.isString(dataSource)) {
  throw new TypeError("Can't connection to data source.");
}
const $server = proxy({
  server: setupServerConnection(dataSource),
});

export const $router = proxy({
  routes: $server.server.then(({ server }) => server.getServerRoutes()),
});

export const $config = proxy({
  config: $server.server.then(({ server }) => server.getAppConfig()),
});
