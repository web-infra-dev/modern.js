import type { IAppContext } from '@modern-js/core';
import { SERVICE_WORKER_ENVIRONMENT_NAME } from '@modern-js/uni-builder';
import {
  isProd,
  isSSR,
  isServiceWorker,
  isUseRsc,
  isUseSSRBundle,
} from '@modern-js/utils';
import type { RsbuildConfig } from '@rsbuild/core';
import type { AppNormalizedConfig, Bundler } from '../../types';
import type { AppToolsContext } from '../../types/new';

export function getBuilderEnvironments<B extends Bundler>(
  normalizedConfig: AppNormalizedConfig<B>,
  appContext: AppToolsContext<B>,
  tempBuilderConfig: Omit<AppNormalizedConfig<B>, 'plugins'>,
) {
  // create entries
  type Entries = Record<string, string[]>;
  const entries: Entries = {};
  const { entrypoints = [], checkedEntries } = appContext;
  for (const { entryName, internalEntry, entry } of entrypoints) {
    if (checkedEntries && !checkedEntries.includes(entryName)) {
      continue;
    }
    const finalEntry = internalEntry || entry;

    if (entryName in entries) {
      entries[entryName].push(finalEntry);
    } else {
      entries[entryName] = [finalEntry];
    }
  }

  const serverEntries: Entries = {};
  for (const entry in entries) {
    const v = entries[entry];
    serverEntries[entry] = v
      .map(entry => entry.replace('index.jsx', 'index.server.jsx'))
      .map(entry => entry.replace('bootstrap.jsx', 'bootstrap.server.jsx'));
  }

  const environments: RsbuildConfig['environments'] = {
    web: {
      output: {
        target: 'web',
      },
      source: {
        entry: entries,
      },
    },
  };

  // copy config should only works in main (web) environment
  if (tempBuilderConfig.output?.copy) {
    environments.web.output!.copy = tempBuilderConfig.output.copy;

    delete tempBuilderConfig.output.copy;
  }

  const useNodeTarget = isProd()
    ? isUseSSRBundle(normalizedConfig) || isUseRsc(normalizedConfig)
    : isSSR(normalizedConfig) || isUseRsc(normalizedConfig);

  if (useNodeTarget) {
    environments.node = {
      output: {
        target: 'node',
      },
      source: {
        entry: serverEntries,
      },
    };
  }

  const useWorkerTarget = isServiceWorker(normalizedConfig);

  if (useWorkerTarget) {
    environments[SERVICE_WORKER_ENVIRONMENT_NAME] = {
      output: {
        target: 'web-worker',
      },
      source: {
        entry: serverEntries,
      },
    };
  }

  return {
    environments,
    builderConfig: tempBuilderConfig,
  };
}
