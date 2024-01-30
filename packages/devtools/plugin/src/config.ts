import {
  ClientDefinition,
  ROUTE_BASENAME,
  SetupClientParams,
} from '@modern-js/devtools-kit/node';
import type { RequiredDeep } from 'type-fest';

export type DevtoolsPluginOptions = Partial<SetupClientParams>;

export interface DevtoolsPluginInlineOptions extends DevtoolsPluginOptions {
  enable?: boolean;
}

export type DevtoolsContext = RequiredDeep<DevtoolsPluginInlineOptions>;

export const getDefaultOptions = () =>
  ({
    def: new ClientDefinition(),
  } satisfies DevtoolsPluginOptions);

export const resolveContext = (
  ...sources: DevtoolsPluginInlineOptions[]
): DevtoolsContext => {
  const ret: DevtoolsContext = {
    enable: process.env.NODE_ENV === 'development',
    dataSource: `${ROUTE_BASENAME}/rpc`,
    endpoint: ROUTE_BASENAME,
    def: new ClientDefinition(),
  };
  for (const opts of sources) {
    ret.enable = opts.enable ?? ret.enable;
    ret.dataSource = opts.dataSource ?? ret.dataSource;
    ret.endpoint = opts.endpoint ?? ret.endpoint;
    if (opts.def) {
      if (opts.def.announcement) {
        Object.assign(ret.def.announcement, opts.def.announcement);
      }
      if (opts.def.assets) {
        Object.assign(ret.def.assets, opts.def.assets);
      }
      if (opts.def.name) {
        Object.assign(ret.def.name, opts.def.name);
      }
      if (opts.def.packages) {
        Object.assign(ret.def.packages, opts.def.packages);
      }
    }
  }
  return ret;
};
