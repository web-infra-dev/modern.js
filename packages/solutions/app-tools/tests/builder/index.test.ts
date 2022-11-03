import type { BuilderTarget } from '@modern-js/builder-shared';
import { createBuilderOptions } from '../../src/builder';

describe('create builder Options', () => {
  it('test create builder Options', () => {
    const targets: BuilderTarget[] = ['node', 'web'];
    const appContext = {
      entrypoints: [
        {
          entryName: 'main',
          entry: './src/index.ts',
        },
        {
          entryName: 'main',
          entry: './src/main.ts',
        },
        {
          entryName: 'next',
          entry: './src/next.ts',
        },
        {
          entryName: 'error',
          entry: '',
        },
      ],
      checkedEntries: ['main', 'next'],
      configFile: 'modern.config.ts',
    };
    const options = createBuilderOptions(targets, appContext as any);
    expect(options).toEqual({
      target: targets,
      configPath: 'modern.config.ts',
      entry: {
        main: ['./src/index.ts', './src/main.ts'],
        next: ['./src/next.ts'],
      },
    });
  });
});
