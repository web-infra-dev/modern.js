import { ClientDefinition, ROUTE_BASENAME } from '@modern-js/devtools-kit/node';
import { DevtoolsConfig } from './types';

export interface DevtoolsPluginOptions extends DevtoolsConfig {
  enable?: boolean;
  endpoint?: string;
  dataSource?: string;
}

export interface DevtoolsContext extends Required<DevtoolsPluginOptions> {
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
    storagePresets: [],
  };

  for (const opts of sources) {
    ret.enable = opts.enable ?? ret.enable;
    ret.dataSource = opts.dataSource ?? ret.dataSource;
    ret.endpoint = opts.endpoint ?? ret.endpoint;
    ret.def = opts.def ?? ret.def;
    opts.storagePresets && ret.storagePresets.push(...opts.storagePresets);
  }
  return ret;
};

export const updateContext = (
  context: DevtoolsContext,
  ...sources: Partial<DevtoolsContext>[]
) => {
  Object.assign(context, resolveContext(context, ...sources));
};
