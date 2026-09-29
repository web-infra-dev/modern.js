import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import React, { act, useId } from 'react';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../src/common';
import { render } from '../../src/core/browser';
import {
  ROUTER_DATA_JSON_ID,
  RenderLevel,
  SSR_DATA_JSON_ID,
} from '../../src/core/constants';
import { setGlobalContext } from '../../src/core/context';
import { registerPlugin } from '../../src/core/plugin';
import { StreamRoot } from '../../src/core/react/streamRoot';

it.each([false, true])(
  'hydrates the existing shell after late data arrives (JSON script: %s)',
  async useJsonScript => {
    const previousHydration = process.env.MODERN_ENABLE_HYDRATION;
    process.env.MODERN_ENABLE_HYDRATION = 'true';
    delete window._SSR_DATA;
    delete window._ROUTER_DATA;
    let ready!: () => void;
    window._SSR_DATA_READY = new Promise<void>(resolve => {
      ready = resolve;
    });
    const beforeRenderData: unknown[] = [];
    setGlobalContext({ entryName: 'index' });
    registerPlugin([
      {
        name: 'check-hydration-shell-context',
        setup(api) {
          api.onBeforeRender(context => {
            beforeRenderData.push(context.initialData, window._ROUTER_DATA);
          });
        },
      },
    ]);
    function Page(_props: { basename: string }) {
      return <p id={useId()}>server shell</p>;
    }
    const element = <Page basename="/" />;
    const container = document.createElement('div');
    // Use the real server root shape, including the shell marker's sibling
    // slot. The transport removes the marker before inserting the HTML.
    container.innerHTML = renderToString(
      <StreamRoot includeMarker>{element}</StreamRoot>,
      { identifierPrefix: SSR_HYDRATION_ID_PREFIX },
    ).replace(ESCAPED_SHELL_STREAM_END_MARK, '');
    document.body.append(container);
    const original = container.firstElementChild;
    const originalId = original!.id;
    const scripts: HTMLElement[] = [];
    let root: Root | undefined;
    try {
      const pending = render(element, container);
      await Promise.resolve();
      expect(beforeRenderData).toEqual([]);
      expect(container.firstElementChild).toBe(original);
      const ssrData = {
        mode: 'stream' as const,
        renderLevel: RenderLevel.SERVER_RENDER,
        data: { initialData: { source: 'server' } },
      };
      const routerData = { loaderData: { page: 'server' }, errors: null };
      if (useJsonScript) {
        for (const [id, data] of [
          [SSR_DATA_JSON_ID, ssrData],
          [ROUTER_DATA_JSON_ID, routerData],
        ] as const) {
          const script = document.createElement('script');
          script.id = id;
          script.type = 'application/json';
          script.textContent = JSON.stringify(data);
          document.body.append(script);
          scripts.push(script);
        }
      } else {
        window._SSR_DATA = ssrData;
        window._ROUTER_DATA = routerData;
      }
      // Resolve the shell handshake while the overall response can still be
      // streaming Remote/Suspense content. No DOMContentLoaded is required.
      await act(async () => {
        ready();
        root = (await pending) as Root;
      });
      expect(beforeRenderData).toEqual([{ source: 'server' }, routerData]);
      expect(container.firstElementChild).toBe(original);
      expect(container.firstElementChild!.id).toBe(originalId);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      scripts.forEach(script => script.remove());
      delete window._SSR_DATA;
      delete window._ROUTER_DATA;
      delete window._SSR_DATA_READY;
      if (previousHydration === undefined) {
        delete process.env.MODERN_ENABLE_HYDRATION;
      } else {
        process.env.MODERN_ENABLE_HYDRATION = previousHydration;
      }
    }
  },
);
