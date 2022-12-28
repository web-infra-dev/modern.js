import { performance } from 'perf_hooks';
import { describe, expect, it } from 'vitest';
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
  it('should throw error when shape wrong', async () => {
    const config = {
      dev: { hmr: false },
      html: { faviconByEntries: [] },
    };
    await expect(
      validateBuilderConfig(config),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Validation error: Expected object, received array at \\"html.faviconByEntries\\""',
    );
  });
  it('should accept correct chained config', async () => {
    const config: BuilderConfig = {
      tools: {
        htmlPlugin: false,
        babel: () => undefined,
        terser: [],
        tsChecker: (_: any) => ({}),
      },
    };
    await expect(validateBuilderConfig(config)).resolves.toMatchInlineSnapshot(`
      {
        "tools": {
          "babel": [Function],
          "htmlPlugin": false,
          "terser": [],
          "tsChecker": [Function],
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
    // eslint-disable-next-line no-console
    console.log(`config validator cost: ${cost.toFixed(2)}ms`);
    expect(cost).lessThan(100);
  });
});
