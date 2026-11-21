import path from 'node:path';

const mockNodeDepEmit = rstest.fn();

rstest.mock('ndepe', () => ({
  nodeDepEmit: (...args: unknown[]) => mockNodeDepEmit(...args),
}));

rstest.mock('@modern-js/utils', () => ({
  chalk: { blue: (v: string) => v },
  fs: {
    remove: rstest.fn(),
    copy: rstest.fn(),
    writeFile: rstest.fn(),
  },
  removeModuleSyncFromExports: (v: unknown) => v,
}));

rstest.mock('../../src/plugins/deploy/utils', () => ({
  readTemplate: rstest.fn(async () => ''),
  resolveESMDependency: rstest.fn(async () => '/entry.js'),
}));

const createParams = (deploy?: Record<string, unknown>) =>
  ({
    appContext: {
      appDirectory: path.join('/', 'app'),
      distDirectory: path.join('/', 'app', 'dist'),
      moduleType: 'module',
    },
    modernConfig: { deploy },
    api: {},
  }) as any;

describe('deploy traceOptions', () => {
  beforeEach(() => {
    mockNodeDepEmit.mockClear();
  });

  it('should forward deploy.traceOptions to the dependency tracer', async () => {
    const { createNodePreset } = await import(
      '../../src/plugins/deploy/platforms/node'
    );
    const traceOptions = { ignore: ['etc/**'] };

    await createNodePreset(createParams({ traceOptions })).end!();

    expect(mockNodeDepEmit).toHaveBeenCalledTimes(1);
    expect(mockNodeDepEmit.mock.calls[0][0]).toMatchObject({ traceOptions });
  });

  it('should pass undefined when deploy.traceOptions is not configured', async () => {
    const { createNodePreset } = await import(
      '../../src/plugins/deploy/platforms/node'
    );

    await createNodePreset(createParams()).end!();

    expect(mockNodeDepEmit).toHaveBeenCalledTimes(1);
    expect(mockNodeDepEmit.mock.calls[0][0].traceOptions).toBeUndefined();
  });
});
