import { deploy } from '../../src/commands/deploy';

const mockBuild = rstest.fn();
const mockGetServerPlugins = rstest.fn();

rstest.mock('../../src/commands/build', () => ({
  build: (...args: unknown[]) => mockBuild(...args),
}));

rstest.mock('../../src/utils/loadPlugins', () => ({
  getServerPlugins: (...args: unknown[]) => mockGetServerPlugins(...args),
}));

const createMockAPI = () => {
  const onBeforeDeploy = { call: rstest.fn() };
  const deployHook = { call: rstest.fn() };
  const onAfterDeploy = { call: rstest.fn() };
  const internalServerPlugins = { call: rstest.fn() };
  const api = {
    getAppContext: rstest.fn(() => ({ metaName: 'modern-js' })),
    getHooks: rstest.fn(() => ({
      onBeforeDeploy,
      deploy: deployHook,
      onAfterDeploy,
      _internalServerPlugins: internalServerPlugins,
    })),
  };

  return {
    api,
    hooks: {
      onBeforeDeploy,
      deploy: deployHook,
      onAfterDeploy,
      internalServerPlugins,
    },
  };
};

describe('command deploy', () => {
  beforeEach(() => {
    rstest.clearAllMocks();
  });

  it('builds once before invoking deploy hooks', async () => {
    const { api, hooks } = createMockAPI();
    const options = { config: 'modern.config.ts' };
    mockBuild.mockImplementationOnce(async () => {
      hooks.internalServerPlugins.call({ plugins: [] });
    });

    await deploy(api as never, options);

    expect(mockBuild).toHaveBeenCalledTimes(1);
    expect(mockBuild).toHaveBeenCalledWith(api);
    expect(mockGetServerPlugins).not.toHaveBeenCalled();
    expect(hooks.internalServerPlugins.call).toHaveBeenCalledTimes(1);
    expect(hooks.onBeforeDeploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onBeforeDeploy.call).toHaveBeenCalledWith(options);
    expect(hooks.deploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onAfterDeploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onAfterDeploy.call).toHaveBeenCalledWith(options);
    expect(mockBuild.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.onBeforeDeploy.call.mock.invocationCallOrder[0],
    );
    expect(hooks.onBeforeDeploy.call.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.deploy.call.mock.invocationCallOrder[0],
    );
    expect(hooks.deploy.call.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.onAfterDeploy.call.mock.invocationCallOrder[0],
    );
  });

  it('loads server plugins without building when skipBuild is enabled', async () => {
    const { api, hooks } = createMockAPI();
    const options = { skipBuild: true };
    mockGetServerPlugins.mockImplementationOnce(async () => {
      hooks.internalServerPlugins.call({ plugins: [] });
    });

    await deploy(api as never, options);

    expect(mockBuild).not.toHaveBeenCalled();
    expect(mockGetServerPlugins).toHaveBeenCalledTimes(1);
    expect(mockGetServerPlugins).toHaveBeenCalledWith(api, 'modern-js');
    expect(hooks.internalServerPlugins.call).toHaveBeenCalledTimes(1);
    expect(hooks.onBeforeDeploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.deploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onAfterDeploy.call).toHaveBeenCalledTimes(1);
  });

  it('does not invoke deploy hooks when build fails', async () => {
    const { api, hooks } = createMockAPI();
    mockBuild.mockRejectedValueOnce(new Error('build failed'));

    await expect(deploy(api as never)).rejects.toThrow('build failed');

    expect(hooks.onBeforeDeploy.call).not.toHaveBeenCalled();
    expect(hooks.deploy.call).not.toHaveBeenCalled();
    expect(hooks.onAfterDeploy.call).not.toHaveBeenCalled();
  });

  it('stops the lifecycle when a deploy hook fails', async () => {
    const { api, hooks } = createMockAPI();
    hooks.deploy.call.mockRejectedValueOnce(new Error('deploy failed'));

    await expect(deploy(api as never)).rejects.toThrow('deploy failed');

    expect(hooks.onBeforeDeploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.deploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onAfterDeploy.call).not.toHaveBeenCalled();
  });
});
