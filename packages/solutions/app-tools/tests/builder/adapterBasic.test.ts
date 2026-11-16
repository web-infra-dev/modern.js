import { createRsbuild } from '@rsbuild/core';
import { describe, expect, it } from '@rstest/core';
import { builderPluginAdapterBasic } from '../../src/builder/shared/builderPlugins/adapterBasic';
import type { BuilderOptions } from '../../src/builder/shared/types';

describe('watch ignored paths', () => {
  it.each(['modern-js', 'custom'])(
    'keeps .%s generated files watched',
    async metaName => {
      const rsbuild = await createRsbuild({
        rsbuildConfig: {
          source: { entry: { main: __filename } },
          plugins: [
            builderPluginAdapterBasic({
              appContext: {
                metaName,
                internalDirectory: `/app/node_modules/.${metaName}`,
              },
            } as BuilderOptions),
          ],
        },
      });
      const [config] = await rsbuild.initConfigs();
      const watchIgnored = config.watchOptions?.ignored;
      expect(Array.isArray(watchIgnored)).toBe(true);
      const ignored = Array.isArray(watchIgnored) ? watchIgnored[0] : undefined;

      expect(ignored).toBeInstanceOf(RegExp);
      if (!(ignored instanceof RegExp)) {
        return;
      }

      for (const separator of ['/', '\\']) {
        const matches = (file: string) =>
          ignored.test(file.replaceAll('/', separator));

        expect(matches('/app/node_modules/react/index.js')).toBe(true);
        expect(matches('/app/.git/index')).toBe(true);
        expect(matches(`/app/node_modules/.${metaName}/entry.ts`)).toBe(false);
        expect(
          matches(`/app/node_modules/.${metaName}/node_modules/pkg/index.js`),
        ).toBe(true);
        expect(matches('/app/src/index.ts')).toBe(false);
        expect(matches('/app/agit/index.ts')).toBe(false);
      }
    },
  );
});
