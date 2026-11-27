import { SERVICE_WORKER_ENVIRONMENT_NAME } from '@modern-js/builder';
import {
  isProd,
  isSSR,
  isServiceWorker,
  isUseRsc,
  isUseSSRBundle,
} from '@modern-js/utils';
import type { RsbuildConfig } from '@rsbuild/core';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/plugin';

export function getBuilderEnvironments(
  normalizedConfig: AppNormalizedConfig,
  appContext: AppToolsContext,
  tempBuilderConfig: Omit<AppNormalizedConfig, 'plugins'>,
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
    client: {
      output: {
        target: 'web',
      },
      source: {
        entry: entries,
      },
    },
  };

  // copy config should only works in main (client) environment
  if (tempBuilderConfig.output?.copy) {
    environments.client.output!.copy = tempBuilderConfig.output.copy;

    delete tempBuilderConfig.output.copy;
  }

  const useNodeTarget =
    isUseRsc(normalizedConfig) ||
    (isProd() ? isUseSSRBundle(normalizedConfig) : isSSR(normalizedConfig));

  if (useNodeTarget) {
    const mf = normalizedConfig.moduleFederation;
    const nodeEntries = { ...serverEntries };
    if (
      typeof mf === 'object' &&
      typeof mf.ssr === 'object' &&
      mf.ssr.cacheUpdates
    ) {
      const ssrEntries = new Set(
        appContext.serverRoutes
          .filter(route => route.isSSR)
          .map(route => route.entryName),
      );
      const generatedEntries = new Set(
        entrypoints
          .filter(entry => entry.isAutoMount && ssrEntries.has(entry.entryName))
          .map(entry => entry.internalEntry),
      );
      for (const [entryName, sources] of Object.entries(entries)) {
        nodeEntries[entryName] = sources.map((source, index) =>
          generatedEntries.has(source)
            ? source.replace(
                /(?:index|bootstrap)\.jsx$/,
                'ssr-bootstrap.server.jsx',
              )
            : serverEntries[entryName][index],
        );
      }
    }
    environments.server = {
      output: {
        target: 'node',
      },
      source: {
        entry: nodeEntries,
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
