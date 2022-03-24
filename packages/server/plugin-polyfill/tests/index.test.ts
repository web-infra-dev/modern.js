import type { NormalizedConfig } from '@modern-js/core';
import cliPugin from '../src/cli';

describe('plugin-static-hosting', () => {
  it('default', () => {
    expect(cliPugin).toBeDefined();
    const instance = cliPugin();
    expect(instance.name).toBe('@modern-js/plugin-polyfill');

    const hooks: any = instance.setup?.({
      useResolvedConfigContext: () => {
        return {
          output: {},
        } as NormalizedConfig;
      },
    } as any);

    const params = { entrypoint: [], partials: [] };
    expect(hooks.htmlPartials(params)).toEqual(params);
  });
});
