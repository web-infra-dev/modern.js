import { getExtensions } from '../config';
import _ from '@modern-js/utils/lodash';
import {
  BuilderTarget,
  BundlerChain,
  ChainedConfig,
  SharedBuilderPluginAPI,
  SharedNormalizedConfig,
} from '../types';
import type { ChainIdentifier } from '@modern-js/utils/chain-id';

export function applyBuilderResolvePlugin(
  api: SharedBuilderPluginAPI,
  applyTsProject?: <CHAIN>(o: {
    extensions: string[];
    CHAIN_ID: ChainIdentifier;
    chain: CHAIN;
  }) => void | Promise<void>,
) {
  api.modifyBundlerChain(async (chain, { target, CHAIN_ID }) => {
    const config = api.getNormalizedConfig();
    const isTsProject = Boolean(api.context.tsconfigPath);
    const extensions = applyExtensions({
      chain,
      config,
      target,
      isTsProject,
    });

    await applyAlias({
      chain,
      config,
      rootPath: api.context.rootPath,
    });

    applyMainFields({
      chain,
      config,
      target,
    });

    if (!isTsProject) {
      return;
    }
    await applyTsProject?.({
      chain,
      CHAIN_ID,
      extensions,
    });
  });
}

function applyExtensions({
  chain,
  config,
  target,
  isTsProject,
}: {
  chain: BundlerChain;
  config: SharedNormalizedConfig;
  target: BuilderTarget;
  isTsProject: boolean;
}) {
  const extensions = getExtensions({
    target,
    isTsProject,
    resolveExtensionPrefix: config.source.resolveExtensionPrefix,
  });

  for (const extension of extensions) {
    chain.resolve.extensions.add(extension);
  }

  return extensions;
}

async function applyAlias({
  chain,
  config,
  rootPath,
}: {
  chain: BundlerChain;
  config: SharedNormalizedConfig;
  rootPath: string;
}) {
  const { alias } = config.source as {
    alias?: ChainedConfig<Record<string, string>>;
  };

  if (!alias) {
    return;
  }
  const { applyOptionsChain, ensureAbsolutePath } = await import(
    '@modern-js/utils'
  );

  const mergedAlias = applyOptionsChain({}, alias);

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  Object.keys(mergedAlias).forEach(name => {
    const values = _.castArray(mergedAlias[name]);
    const formattedValues = values.map(value => {
      if (typeof value === 'string' && value.startsWith('.')) {
        return ensureAbsolutePath(rootPath, value);
      }
      return value;
    });

    chain.resolve.alias.set(
      name,
      formattedValues.length === 1 ? formattedValues[0] : formattedValues,
    );
  });
}

function applyMainFields({
  chain,
  config,
  target,
}: {
  chain: BundlerChain;
  config: SharedNormalizedConfig;
  target: BuilderTarget;
}) {
  const { resolveMainFields } = config.source;
  if (!resolveMainFields) {
    return;
  }

  const mainFields = Array.isArray(resolveMainFields)
    ? resolveMainFields
    : resolveMainFields[target];

  if (mainFields) {
    mainFields
      .reduce((result: string[], fields) => {
        if (Array.isArray(fields)) {
          result.push(...fields);
        } else {
          result.push(fields);
        }
        return result;
      }, [] as string[])
      .forEach(field => {
        chain.resolve.mainFields.add(field);
      });
  }
}
