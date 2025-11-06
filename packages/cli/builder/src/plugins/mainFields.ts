import type { RsbuildPlugin, RsbuildTarget } from '@rsbuild/core';
import type { MainFields } from '../types';

export const pluginMainFields = (
  resolveMainFields: MainFields | Partial<Record<RsbuildTarget, MainFields>>,
): RsbuildPlugin => ({
  name: 'builder:main-fields',

  setup(api) {
    api.modifyBundlerChain((chain, { target }) => {
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
    });
  },
});
