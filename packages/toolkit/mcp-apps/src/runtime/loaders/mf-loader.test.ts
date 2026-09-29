import { createInstance } from '@module-federation/enhanced/runtime';
import { beforeEach, describe, expect, it, rstest } from '@rstest/core';
import { loadRemoteComponent } from './mf-loader';

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
      addLog: rstest.fn(),
      mfInstanceRef: { current: null },
      lastRemoteNameRef: { current: '' },
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
});
