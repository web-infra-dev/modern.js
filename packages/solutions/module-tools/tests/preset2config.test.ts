import { presetToConfig } from '../src/config/normalize';
import type { BuildPreset } from '../src/types';

describe('presetToConfig', () => {
  it('extendPreset', async () => {
    const extendPreset: BuildPreset = function ({ extendPreset }) {
      return extendPreset('npm-library', {
        define: {
          VERSION: '1.0.1',
        },
      });
    };
    const buildConfig = await presetToConfig(extendPreset);
    buildConfig!.forEach(c => {
      expect(c.define!.VERSION).toBe('1.0.1');
    });
  });
  it('preset', async () => {
    const preset: BuildPreset = function ({ preset }) {
      const { NPM_LIBRARY } = preset;
      return NPM_LIBRARY.map(config => {
        config.define = {
          VERSION: '1.0.2',
        };
        return config;
      });
    };
    const buildConfig = await presetToConfig(preset);
    buildConfig!.forEach(c => {
      expect(c.define!.VERSION).toBe('1.0.2');
    });
  });
});
