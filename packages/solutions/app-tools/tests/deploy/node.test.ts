import path from 'node:path';
import { nodeDepEmit } from 'ndepe';
import { createNodePreset } from '../../src/plugins/deploy/platforms/node';

rstest.mock('ndepe', () => ({
  __esModule: true,
  nodeDepEmit: rstest.fn(),
}));

const nodeDepEmitMock = nodeDepEmit as unknown as ReturnType<typeof rstest.fn>;

describe('createNodePreset', () => {
  it('should copy the packages named in deploy.copyWholePackages in full', async () => {
    const appContext = {
      appDirectory: path.join(__dirname, 'fixtures'),
      distDirectory: path.join(__dirname, 'fixtures', 'dist'),
      moduleType: 'commonjs',
    };

    const preset = createNodePreset({
      appContext: appContext as any,
      modernConfig: { deploy: { copyWholePackages: ['zod'] } } as any,
      api: {} as any,
      needModernServer: true,
    });
    await preset.end!();

    expect(nodeDepEmitMock).toHaveBeenCalledTimes(1);
    const { copyWholePackage } = nodeDepEmitMock.mock.calls[0][0];
    expect(copyWholePackage('@modern-js/utils')).toBe(true);
    expect(copyWholePackage('zod')).toBe(true);
    expect(copyWholePackage('react')).toBe(false);
  });
});
