import { ClientDefinition, ROUTE_BASENAME } from '@modern-js/devtools-kit/node';
import type { RequiredDeep } from 'type-fest';

export interface DevtoolsPluginOptions {
  enable?: boolean;
  endpoint?: string;
  dataSource?: string;
}

export interface DevtoolsContext extends RequiredDeep<DevtoolsPluginOptions> {
  def: ClientDefinition;
}

export const resolveContext = (
  ...sources: Partial<DevtoolsContext>[]
): DevtoolsContext => {
  const ret: DevtoolsContext = {
    enable: process.env.NODE_ENV === 'development',
    dataSource: `${ROUTE_BASENAME}/rpc`,
    endpoint: ROUTE_BASENAME,
    def: new ClientDefinition(),
  };

  // Keep resource query always existing.
  Object.assign(ret, { __keep: true });

  for (const opts of sources) {
    ret.enable = opts.enable ?? ret.enable;
    ret.dataSource = opts.dataSource ?? ret.dataSource;
    ret.endpoint = opts.endpoint ?? ret.endpoint;
    ret.def = opts.def ?? ret.def;
  }
  return ret;
};
