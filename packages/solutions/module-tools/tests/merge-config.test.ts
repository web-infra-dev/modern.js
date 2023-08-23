import { mergeConfig } from '../src/config/normalize';
import { DTSOptions, PartialBaseBuildConfig } from '../src/types';

const defaultConfig: PartialBaseBuildConfig[] = [
  {
    format: 'esm',
    dts: { distPath: './types' },
  },
];

describe('mergeConfig', () => {
  it('config is array', () => {
    const config = mergeConfig(defaultConfig, [
      {
        format: 'cjs',
        target: 'es2020',
      },
    ]);
    expect(config.length).toBe(2);
  });
  it('config is object', () => {
    const config = mergeConfig(defaultConfig, {
      format: 'cjs',
    });
    expect(config[0].format).toBe('cjs');
  });
  it('config is a deep object', () => {
    const config = mergeConfig(defaultConfig, {
      dts: { distPath: './deep' },
    });
    expect((config[0].dts as DTSOptions).distPath).toBe('./deep');
  });
});
