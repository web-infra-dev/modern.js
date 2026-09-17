import type { Command } from '@modern-js/utils';
import { deployCommand } from '../../src/commands';

const mockBuild = rstest.fn();
const mockDeploy = rstest.fn();

rstest.mock('../../src/commands/build', () => ({
  build: (...args: unknown[]) => mockBuild(...args),
}));

rstest.mock('../../src/commands/deploy', () => ({
  deploy: (...args: unknown[]) => mockDeploy(...args),
}));

const setupDeployCommand = () => {
  let action: ((options: { skipBuild?: boolean }) => Promise<void>) | undefined;
  const command = {
    usage: rstest.fn().mockReturnThis(),
    option: rstest.fn().mockReturnThis(),
    description: rstest.fn().mockReturnThis(),
    action: rstest.fn(callback => {
      action = callback;
      return command;
    }),
  };
  const program = {
    command: rstest.fn(() => command),
  };
  const api = {};

  deployCommand(program as unknown as Command, api as never);

  if (!action) {
    throw new Error('deploy action was not registered');
  }

  return { action, api };
};

describe('deploy command', () => {
  let exit: ReturnType<typeof rstest.spyOn>;

  beforeEach(() => {
    rstest.clearAllMocks();
    exit = rstest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    exit.mockRestore();
  });

  it('builds before deploying by default', async () => {
    const { action, api } = setupDeployCommand();

    await action({});

    expect(mockBuild).toHaveBeenCalledWith(api);
    expect(mockDeploy).toHaveBeenCalledWith(api, {});
    expect(mockBuild.mock.invocationCallOrder[0]).toBeLessThan(
      mockDeploy.mock.invocationCallOrder[0],
    );
  });

  it('skips the build when requested', async () => {
    const { action, api } = setupDeployCommand();
    const options = { skipBuild: true };

    await action(options);

    expect(mockBuild).not.toHaveBeenCalled();
    expect(mockDeploy).toHaveBeenCalledWith(api, options);
  });
});
