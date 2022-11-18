import type { CliNormalizedConfig } from '@modern-js/core';

const allowedFeatures = ['router', 'state'];

export default function resolvePlugins(
  features: CliNormalizedConfig<{
    normalizedConfig: {
      runtime: any;
    };
  }>['runtime'],
) {
  const plugins: any[] = [];

  if (!features) {
    return plugins;
  }

  Object.keys(features).forEach(feature => {
    if (allowedFeatures.includes(feature)) {
      const curPluginRes = require(`@modern-js/runtime/plugins`)[feature]({
        ...features[feature],
      });

      plugins.push(curPluginRes);
    }
  });

  return plugins;
}
