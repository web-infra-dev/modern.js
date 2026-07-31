import appToolsDefault, {
  appTools,
  build,
  closeServer,
  deploy,
  mergeConfig,
} from '../src';

describe('app-tools export', () => {
  it('default export', () => {
    expect(appToolsDefault).toBeDefined();
  });

  it('named export', () => {
    expect(appTools).toBeDefined();
    expect(build).toBeDefined();
    expect(deploy).toBeDefined();
    expect(closeServer).toBeDefined();
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
