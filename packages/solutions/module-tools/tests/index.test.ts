import ModuleToolsPlugin, { defineConfig, legacyPresets } from '../src';

describe('index', () => {
  it('defineConfig', () => {
    expect(defineConfig({})).toBeDefined();
  });

  it('Plugin', () => {
    expect(ModuleToolsPlugin()).toBeDefined();
  });

  it('legacyPresets', () => {
    expect(legacyPresets).toBeDefined();
  });
});
