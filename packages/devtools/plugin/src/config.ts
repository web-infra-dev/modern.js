import {
  ClientDefinition,
  RPC_SERVER_PATHNAME,
  SetupClientOptions,
} from '@modern-js/devtools-kit';
import _ from '@modern-js/utils/lodash';
import { PartialDeep } from 'type-fest';
import { CliPluginAPI } from './types';

export interface Options extends SetupClientOptions {
  rpcPath?: string;
  def?: PartialDeep<ClientDefinition>;
}

export const getDefaultOptions = (): Options => ({
  rpcPath: RPC_SERVER_PATHNAME,
  def: new ClientDefinition(),
});

export const resolveOptions = (api: CliPluginAPI, options: Options = {}) => {
  const config = api.useConfigContext();
  const opts: Options = _.defaultsDeep(
    {},
    options,
    config.devtools,
    getDefaultOptions(),
  );
  return opts;
};
