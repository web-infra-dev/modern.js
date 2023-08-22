import { mergeConfig } from '../src/config/normalize';
import { internalPreset } from '../src/constants/preset';
import { DTSOptions } from '../src/types';

describe('mergeConfig', () => {
  it('config is array', () => {
    const config = mergeConfig(internalPreset['base-config'], [
      {
        format: 'cjs',
        target: 'es2020',
      },
    ]);
    expect(config.length).toBe(2);
  });
  it('config is object', () => {
    const config = mergeConfig(internalPreset['base-config'], {
      format: 'cjs',
    });
    expect(config[0].format).toBe('cjs');
  });
  it('config is a deep object', () => {
    const config = mergeConfig(internalPreset['base-config'], {
      dts: { distPath: './deep' },
    });
    expect((config[0].dts as DTSOptions).distPath).toBe('./deep');
  });
});
