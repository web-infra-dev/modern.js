import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { PluginImage } from '@/plugins/image';

describe('plugins/image', () => {
  it('should add image rules correctly', async () => {
    const builder = await createBuilder({
      plugins: [PluginImage()],
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use distPath.image to modify dist path', async () => {
    const builder = await createBuilder({
      plugins: [PluginImage()],
      builderConfig: {
        output: {
          distPath: {
            image: 'foo',
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use distPath.image to be empty string', async () => {
    const builder = await createBuilder({
      plugins: [PluginImage()],
      builderConfig: {
        output: {
          distPath: {
            image: '',
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use filename.image to modify filename', async () => {
    const builder = await createBuilder({
      plugins: [PluginImage()],
      builderConfig: {
        output: {
          filename: {
            image: 'foo[ext]',
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
