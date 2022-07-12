/**
 * @jest-environment node
 */
import * as path from 'path';
import { scanImports } from '../src/install/scan-imports';

describe('tes unbundle scan-import', () => {
  const config = {
    output: { path: '' },
    source: { include: undefined, alias: {} },
  };

  // TODO
  it('scan imports with no dependencies', async () => {
    const appContext = {
      appDirectory: path.join(__dirname, './fixtures/scan-imports'),
    };
    const result = await scanImports(config as any, appContext as any, [], {});
    expect(result).toBeTruthy();
    expect(result.deps).toHaveLength(0);
  });

  it('scan imports in mono-repo', async () => {
    const appContext = {
      appDirectory: path.join(
        __dirname,
        './fixtures/scan-imports-monorepo/packages/module-importer',
      ),
    };
    const result = await scanImports(
      config as any,
      appContext as any,
      ['module-a', 'module-b'],
      {},
    );

    expect(result).toBeTruthy();
    // TODO: complete tests for mono repo scan
  });
});
