import { createInstance } from '@module-federation/enhanced/runtime';
import { beforeEach, describe, expect, it, rstest } from '@rstest/core';
import { loadRemoteComponent } from '../src/mf-runtime/mf-loader';

rstest.mock('@module-federation/enhanced/runtime', () => ({
  createInstance: rstest.fn(),
}));

beforeEach(() => {
  rstest.clearAllMocks();
});

describe('standard MF loading', () => {
  it('loads a manifest without a type selector and reuses the remote instance', async () => {
    const View = () => null;
    const loadRemote = rstest.fn().mockResolvedValue({ default: View });
    rstest.mocked(createInstance).mockReturnValue({
      loadRemote,
    } as unknown as ReturnType<typeof createInstance>);
    const options = {
      config: {
        remoteName: 'cards',
        remoteEntry: '//cdn.example.com/mf-manifest.json',
        module: './Greeting',
        exportName: 'default',
      },
      instances: new Map(),
    };

    expect(await loadRemoteComponent(options)).toBe(View);
    expect(createInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        remotes: [
          { name: 'cards', entry: 'https://cdn.example.com/mf-manifest.json' },
        ],
      }),
    );
    expect(
      rstest.mocked(createInstance).mock.calls[0][0].plugins,
    ).toBeUndefined();
    expect(loadRemote).toHaveBeenCalledWith('cards/Greeting');

    expect(await loadRemoteComponent(options)).toBe(View);
    expect(createInstance).toHaveBeenCalledTimes(1);
  });
  it('isolates entries for the same remote and reuses previous remotes after switching', async () => {
    const First = () => null;
    const Second = () => null;
    const firstLoad = rstest.fn().mockResolvedValue({ default: First });
    const secondLoad = rstest.fn().mockResolvedValue({ default: Second });
    rstest
      .mocked(createInstance)
      .mockReturnValueOnce({ loadRemote: firstLoad } as unknown as ReturnType<
        typeof createInstance
      >)
      .mockReturnValueOnce({ loadRemote: secondLoad } as unknown as ReturnType<
        typeof createInstance
      >);
    const options = {
      config: {
        remoteName: 'cards',
        remoteEntry: 'https://cdn.example/v1/mf-manifest.json',
        module: './Greeting',
        exportName: 'default',
      },
      instances: new Map(),
    };
    expect(await loadRemoteComponent(options)).toBe(First);
    expect(
      await loadRemoteComponent({
        ...options,
        config: {
          ...options.config,
          remoteEntry: 'https://cdn.example/v2/mf-manifest.json',
        },
      }),
    ).toBe(Second);
    expect(await loadRemoteComponent(options)).toBe(First);
    expect(createInstance).toHaveBeenCalledTimes(2);
    expect(firstLoad).toHaveBeenCalledTimes(2);
  });
});
