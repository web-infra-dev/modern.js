import { createBuilderModuleScope } from '../../src/config/initialize/inits';
import { AppNormalizedConfig } from '../../src/types';

describe('test createBuilderModuleScope', () => {
  it('should return undefined when moduleScope = undefined', () => {
    const config: AppNormalizedConfig = {
      source: {},
    } as any;
    const moduleScopes = createBuilderModuleScope(config);

    expect(moduleScopes).toBeUndefined();
  });

  it('should merge config when moduleScope as a Array', () => {
    const config: AppNormalizedConfig = {
      source: {
        moduleScopes: ['hello', /abc/],
      },
    } as any;

    const moduleScopes = createBuilderModuleScope(config);

    expect(moduleScopes).toEqual([
      './src',
      './shared',
      /node_modules/,
      'hello',
      /abc/,
    ]);
  });

  it('should though function handle when moduleScopes as a function', () => {
    const config: AppNormalizedConfig = {
      source: {
        moduleScopes(module: Array<string>) {
          module.pop();
          module.push('abc');
        },
      },
    } as any;
    const moduleScopes = createBuilderModuleScope(config);
    expect(moduleScopes).toEqual(['./src', './shared', 'abc']);
  });
});
