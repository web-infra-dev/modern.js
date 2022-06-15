import { resolve } from 'path';
import { applyUserBabelConfig } from '../src';

describe('applyUserBabelConfig', () => {
  test('should add plugins correctly', () => {
    const config = applyUserBabelConfig({}, (config, utils) => {
      utils.addPlugins(['foo', ['bar', {}]]);
    });

    expect(config).toEqual({ plugins: ['foo', ['bar', {}]] });
  });

  test('should add presets correctly', () => {
    const config = applyUserBabelConfig({}, (config, utils) => {
      utils.addPresets(['foo', ['bar', {}]]);
    });

    expect(config).toEqual({ presets: ['foo', ['bar', {}]] });
  });

  test('should remove plugins correctly', () => {
    const config = applyUserBabelConfig(
      {
        plugins: [
          resolve('/node_modules/foo'),
          [resolve('/node_modules/bar'), {}],
        ],
      },
      (config, utils) => {
        utils.removePlugins('foo');
        utils.removePlugins(['bar', 'baz']);
      },
    );

    expect(config).toEqual({ plugins: [] });
  });

  test('should remove presets correctly', () => {
    const config = applyUserBabelConfig(
      {
        presets: [
          resolve('/node_modules/foo'),
          [resolve('/node_modules/bar'), {}],
        ],
      },
      (config, utils) => {
        utils.removePresets('foo');
        utils.removePresets(['bar', 'baz']);
      },
    );

    expect(config).toEqual({ presets: [] });
  });

  test('should allow to remove plugins from an empty config', () => {
    const config = applyUserBabelConfig({}, (config, utils) => {
      utils.removePlugins('foo');
    });

    expect(config).toEqual({});
  });

  test('should allow to remove presets from an empty config', () => {
    const config = applyUserBabelConfig({}, (config, utils) => {
      utils.removePresets('foo');
    });

    expect(config).toEqual({});
  });
});
