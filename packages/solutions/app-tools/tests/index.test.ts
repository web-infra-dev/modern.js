import appToolsDefault, { appTools, closeServer, mergeConfig } from '../src';
import * as appToolsExports from '../src';
import type { DeployOptions } from '../src';

describe('app-tools export', () => {
  it('default export', () => {
    expect(appToolsDefault).toBeDefined();
  });

  it('named export', () => {
    const deployOptions: DeployOptions = { skipBuild: true };

    expect(appTools).toBeDefined();
    expect(closeServer).toBeDefined();
    expect(deployOptions.skipBuild).toBe(true);
    expect(appToolsExports).not.toHaveProperty('build');
    expect(appToolsExports).not.toHaveProperty('deploy');
  });
});

describe('merge config', () => {
  test('should replace property deeply', () => {
    expect(
      mergeConfig([
        {
          source: { disableDefaultEntries: false },
          output: { polyfill: 'usage' },
        },
        {
          source: { disableDefaultEntries: true },
          output: { polyfill: 'entry' },
        },
      ]),
    ).toEqual({
      source: { disableDefaultEntries: true },
      output: { polyfill: 'entry' },
    });
  });
});
