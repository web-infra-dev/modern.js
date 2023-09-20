import { ClientDefinition } from '@modern-js/devtools-kit';
import _ from '@modern-js/utils/lodash';
import { PartialDeep } from 'type-fest';
import { CliPluginAPI } from './types';

export interface Options {
  prefix?: string;
  def?: PartialDeep<ClientDefinition>;
}

export const getDefaultOptions = () =>
  ({
    prefix: '/_modern_js/devtools',
    def: new ClientDefinition(),
  } satisfies Options);

export const resolveOptions = (api: CliPluginAPI, options: Options = {}) => {
  const config = api.useConfigContext();
  const opts: Options & ReturnType<typeof getDefaultOptions> = _.defaultsDeep(
    {},
    options,
    config.devtools,
    getDefaultOptions(),
  );
  return opts;
};
