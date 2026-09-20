import { deploy } from '../../src/commands/deploy';

const mockGetServerPlugins = rstest.fn();

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

  it('loads server plugins before invoking deploy hooks', async () => {
    const { api, hooks } = createMockAPI();
    const options = { config: 'modern.config.ts' };
    mockGetServerPlugins.mockImplementationOnce(async () => {
      hooks.internalServerPlugins.call({ plugins: [] });
    });

    await deploy(api as never, options);

    expect(mockGetServerPlugins).toHaveBeenCalledTimes(1);
    expect(mockGetServerPlugins).toHaveBeenCalledWith(api, 'modern-js');
    expect(hooks.internalServerPlugins.call).toHaveBeenCalledTimes(1);
    expect(hooks.onBeforeDeploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onBeforeDeploy.call).toHaveBeenCalledWith(options);
    expect(hooks.deploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onAfterDeploy.call).toHaveBeenCalledTimes(1);
    expect(hooks.onAfterDeploy.call).toHaveBeenCalledWith(options);
    expect(mockGetServerPlugins.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.onBeforeDeploy.call.mock.invocationCallOrder[0],
    );
    expect(hooks.onBeforeDeploy.call.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.deploy.call.mock.invocationCallOrder[0],
    );
    expect(hooks.deploy.call.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.onAfterDeploy.call.mock.invocationCallOrder[0],
    );
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
