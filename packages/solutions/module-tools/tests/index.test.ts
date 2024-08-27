import { defineConfig, legacyPresets, moduleTools } from '../src';

describe('index', () => {
  it('defineConfig', () => {
    expect(defineConfig({})).toBeDefined();
  });

  it('Plugin', () => {
    expect(moduleTools()).toBeDefined();
  });

  it('legacyPresets', () => {
    expect(legacyPresets).toBeDefined();
  });
});
