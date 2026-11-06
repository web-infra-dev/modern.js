import { runtime } from '@modern-js/plugin/runtime';
import { revalidate, flushChunks } from '@module-federation/node/utils';
import { flushDataFetch } from '@module-federation/bridge-react/data-fetch';
import { expect, it, rs } from '@rstest/core';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mfSSRDevPlugin } from './devPlugin';

rs.mock('@module-federation/node/utils', () => ({
  revalidate: rs.fn(),
  flushChunks: rs.fn(async () => {}),
}));
rs.mock('@module-federation/bridge-react/data-fetch', () => ({
  flushDataFetch: rs.fn(),
}));
rs.mock('./SSRLiveReload', () => ({
  SSRLiveReload: ({ shouldUpdate }: { shouldUpdate: boolean }) =>
    React.createElement('span', { 'data-reload': String(shouldUpdate) }),
}));

it('keeps reload decisions local to each runtime even with one reused plugin definition', async () => {
  // This package's Node test preset uses classic JSX, while rs lib emits the
  // automatic JSX runtime. Supply the actual React object for source rendering.
  rs.stubGlobal('React', React);
  rs.spyOn(console, 'log').mockImplementation(() => {});
  const plugin = mfSSRDevPlugin();
  const instances = [0, 1].map(
    () => runtime.run({ plugins: [plugin], config: {} }).runtimeContext,
  );
  await Promise.all(instances.map(instance => instance.ready));
  const Page = ({ label }: { label: string }) => <p>{label}</p>;
  const [First, Second] = instances.map(instance =>
    instance.hooks.wrapRoot.call(Page),
  );
  let completeFirst!: (value: boolean) => void;
  rs.mocked(revalidate)
    .mockImplementationOnce(
      () =>
        new Promise<boolean>(resolve => {
          completeFirst = resolve;
        }),
    )
    .mockResolvedValueOnce(false);
  try {
    const firstRequest = instances[0].hooks.onBeforeRender.call(
      instances[0].runtimeContext,
    );
    await expect.poll(() => rs.mocked(revalidate).mock.calls.length).toBe(1);
    await instances[1].hooks.onBeforeRender.call(instances[1].runtimeContext);
    completeFirst(true);
    await firstRequest;
    expect(renderToStaticMarkup(<First label="first" />)).toBe(
      '<span data-reload="true"></span><p>first</p>',
    );
    expect(renderToStaticMarkup(<Second label="second" />)).toBe(
      '<span data-reload="false"></span><p>second</p>',
    );

    // Reuse the installed wrappers after each runtime changes independently.
    rs.mocked(revalidate)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    await instances[0].hooks.onBeforeRender.call(instances[0].runtimeContext);
    await instances[1].hooks.onBeforeRender.call(instances[1].runtimeContext);
    expect(renderToStaticMarkup(<First label="first updated" />)).toBe(
      '<span data-reload="false"></span><p>first updated</p>',
    );
    expect(renderToStaticMarkup(<Second label="second updated" />)).toBe(
      '<span data-reload="true"></span><p>second updated</p>',
    );
    expect(flushChunks).toHaveBeenCalledTimes(2);
    expect(flushDataFetch).toHaveBeenCalledTimes(2);
  } finally {
    instances.forEach(instance => instance.dispose());
    rs.unstubAllGlobals();
  }
});
