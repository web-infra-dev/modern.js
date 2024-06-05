import {
  ClientDefinition,
  DevtoolsContext,
  ROUTE_BASENAME,
} from '@modern-js/devtools-kit/node';

export interface DevtoolsPluginOptions {
  enable?: boolean;
  endpoint?: string;
  dataSource?: string;
}

export const resolveContext = (
  ...sources: Partial<DevtoolsContext>[]
): DevtoolsContext => {
  const ret: DevtoolsContext = {
    enable: true,
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
