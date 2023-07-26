import { performance } from 'perf_hooks';
import { describe, expect, it, vi } from 'vitest';
import { logger } from '@modern-js/builder-shared';
import { createDefaultConfig } from '@/config/defaults';
import { validateBuilderConfig } from '@/config/validate';
import { BuilderConfig } from '@/types';

describe('validateBuilderConfig', () => {
  it('should accept empty object', async () => {
    await expect(validateBuilderConfig({})).resolves.toEqual({});
  });
  it('should remove unknown properties', async () => {
    await expect(validateBuilderConfig({ foo: 123 })).resolves.toEqual({});
  });

  it('should log warning when joint validation exception', async () => {
    vi.mock('@modern-js/utils/chalk', async importOriginal => {
      const mod = await importOriginal<any>();
      mod.yellow = (str: string) => str;
      return mod;
    });

    vi.mock('@modern-js/builder-shared', async importOriginal => {
      const mod = await importOriginal<any>();
      return {
        ...mod,
        logger: {
          ...mod.logger,
          warn: vi.fn(),
        },
      };
    });

    await validateBuilderConfig({
      output: {
        enableCssModuleTSDeclaration: true,
      },
    });

    expect(logger.warn).toBeCalledWith(
      'enableCssModuleTSDeclaration only takes effect when output.disableCssExtract is set to true',
    );
  });

  it('should throw error when shape wrong', async () => {
    const config = {
      dev: { hmr: false },
      html: { faviconByEntries: [] },
    };
    await expect(
      validateBuilderConfig({
        output: {
          polyfill: 'usage',
        },
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Builder config validation error:
      * Invalid enum value. Expected 'entry' | 'ua' | 'off', received 'usage' at \\"output.polyfill\\""
    `);

    await expect(validateBuilderConfig(config)).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "Builder config validation error:
      * Expected object, received array at \\"html.faviconByEntries\\""
    `);
  });
  it('should accept correct chained config', async () => {
    const config: BuilderConfig = {
      tools: {
        htmlPlugin: false,
        rspack: (_: any) => ({}),
      },
    };
    await expect(validateBuilderConfig(config)).resolves.toMatchInlineSnapshot(`
      {
        "tools": {
          "htmlPlugin": false,
          "rspack": [Function],
        },
      }
    `);
  });
  it('should validate config and cost less than 100ms', async () => {
    const config = createDefaultConfig();
    const startedAt = performance.now();
    await validateBuilderConfig(config);
    const endedAt = performance.now();
    const cost = endedAt - startedAt;
    console.log(`config validator cost: ${cost.toFixed(2)}ms`);
    expect(cost).lessThan(100);
  });
});
