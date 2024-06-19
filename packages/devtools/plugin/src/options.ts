import {
  ClientDefinition,
  DevtoolsContext,
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
    def: new ClientDefinition(),
    storagePresets: [],
  };

  for (const opts of sources) {
    ret.enable = opts.enable ?? ret.enable;
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
