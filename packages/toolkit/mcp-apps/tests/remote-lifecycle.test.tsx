import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createInstance } from '@module-federation/enhanced/runtime';
import { RemoteComponentContainer } from '../src/mf-runtime/remote';

rs.mock('@module-federation/enhanced/runtime', () => ({
  createInstance: rs.fn(),
}));

const config = {
  remoteName: 'test',
  remoteEntry: 'https://example.com/mf-manifest.json',
  module: './View',
  exportName: 'default',
  renderMode: 'mount' as const,
};
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  rs.clearAllMocks();
});
async function render(
  props: React.ComponentProps<typeof RemoteComponentContainer>,
) {
  await act(async () => {
    root.render(<RemoteComponentContainer {...props} />);
  });
}

it('mounts once, updates later props, and clears recovered update errors', async () => {
  const update = rs.fn((props: Record<string, unknown>) => {
    if (props.fail) throw new Error('Update failed');
  });
  const unmount = rs.fn();
  const mount = rs.fn(() => ({ update, unmount }));
  rs.mocked(createInstance).mockReturnValue({
    loadRemote: async () => ({ default: { mount } }),
  } as never);
  await render({ config, args: { value: 1 } });
  expect(mount).toHaveBeenCalledTimes(1);
  expect(update).not.toHaveBeenCalled();
  await render({ config, args: { fail: true } });
  expect(container.textContent).toContain('Update failed');
  await render({ config, args: { value: 2 } });
  expect(container.textContent).not.toContain('Update failed');
  expect(mount).toHaveBeenCalledTimes(1);
});

it('never invokes a previous React component as a mount function on mode changes', async () => {
  const view = rs.fn(() => <p>React view</p>);
  let resolveMount!: (value: unknown) => void;
  const pending = new Promise(resolve => {
    resolveMount = resolve;
  });
  rs.mocked(createInstance)
    .mockReturnValueOnce({
      loadRemote: async () => ({ default: view }),
    } as never)
    .mockReturnValueOnce({ loadRemote: () => pending } as never);
  await render({ config: { ...config, renderMode: 'component' } });
  view.mockClear();
  await render({ config });
  expect(view).not.toHaveBeenCalled();
  expect(container.textContent).toContain('Loading component');
  const mount = rs.fn();
  await act(async () => {
    resolveMount({ default: { mount } });
  });
  expect(mount).toHaveBeenCalledTimes(1);
});

it('retries a failed load without reloading the page', async () => {
  rs.mocked(createInstance)
    .mockReturnValueOnce({
      loadRemote: async () => {
        throw new Error('Network failed');
      },
    } as never)
    .mockReturnValueOnce({
      loadRemote: async () => ({ default: () => <p>Recovered</p> }),
    } as never);
  await render({ config: { ...config, renderMode: 'component' } });
  expect(container.textContent).toContain('Network failed');
  await act(async () => {
    container.querySelector('button')!.click();
  });
  expect(container.textContent).toContain('Recovered');
});

it('clears old mount errors when switching to React mode and runs cleanup', async () => {
  const unmount = rs.fn();
  rs.mocked(createInstance)
    .mockReturnValueOnce({
      loadRemote: async () => ({
        default: {
          mount: () => ({
            update() {
              throw new Error('Old failure');
            },
            unmount,
          }),
        },
      }),
    } as never)
    .mockReturnValueOnce({
      loadRemote: async () => ({ default: () => <p>New view</p> }),
    } as never);
  await render({ config, args: { value: 1 } });
  await render({ config, args: { value: 2 } });
  expect(container.textContent).toContain('Old failure');
  await render({ config: { ...config, renderMode: 'component' } });
  expect(container.textContent).not.toContain('Old failure');
  expect(container.textContent).toContain('New view');
  expect(unmount).toHaveBeenCalledTimes(1);
});
