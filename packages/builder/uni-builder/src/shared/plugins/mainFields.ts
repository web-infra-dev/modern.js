import type { RsbuildPlugin } from '@rsbuild/core';
import type { MainFields } from '../../types';
import type { RsbuildTarget } from '@rsbuild/shared';

export const pluginMainFields = (
  resolveMainFields: MainFields | Partial<Record<RsbuildTarget, MainFields>>,
): RsbuildPlugin => ({
  name: 'uni-builder:main-fields',

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
