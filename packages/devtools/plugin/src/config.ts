import { ClientDefinition } from '@modern-js/devtools-kit';
import _ from '@modern-js/utils/lodash';
import { PartialDeep } from 'type-fest';
import { CliPluginAPI } from './types';

export interface DevtoolsPluginOptions {
  def?: PartialDeep<ClientDefinition>;
}

export interface DevtoolsPluginInlineOptions extends DevtoolsPluginOptions {
  enable?: boolean;
}

export const getDefaultOptions = () =>
  ({
    def: new ClientDefinition(),
  } satisfies DevtoolsPluginOptions);

export const resolveOptions = (
  api: CliPluginAPI,
  options: DevtoolsPluginOptions = {},
) => {
  const config = api.useConfigContext();
  const opts: DevtoolsPluginOptions & ReturnType<typeof getDefaultOptions> =
    _.defaultsDeep({}, options, config.devtools, getDefaultOptions());
  return opts;
};
