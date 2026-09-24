import { createContext, runInContext } from 'node:vm';
import { RenderLevel } from '../../src/core/constants';
import { getInitialContext } from '../../src/core/context/runtime';
import { getTemplates } from '../../src/core/server/stream/template';
import type { SSRServerContext } from '../../src/core/types';

it.each([false, true])(
  'announces shell readiness before entry scripts and resolves after data (JSON: %s)',
  async useJsonScript => {
    const runtimeContext = getInitialContext(false);
    runtimeContext.ssrContext = {
      request: { headers: {}, query: {}, params: {}, pathname: '/' },
    } as SSRServerContext;
    const { shellBefore, shellAfter } = await getTemplates(
      '<!doctype html><html><head><script async src="/entry.js"></script></head><body><div id="root"><!--<?- html ?>--></div><script src="/async-entry.js"></script><!--<?- SSRDataScript ?>--></body></html>',
      {
        request: new Request('http://host/'),
        runtimeContext,
        renderLevel: RenderLevel.SERVER_RENDER,
        ssrConfig: true,
        entryName: 'index',
        config: { nonce: 'shell-nonce', useJsonScript },
      },
    );
    expect(shellBefore.indexOf('_SSR_DATA_READY =')).toBeLessThan(
      shellBefore.indexOf('src="/entry.js"'),
    );
    const dataIndex = shellAfter.indexOf(
      useJsonScript ? '__MODERN_SSR_DATA__' : 'window._SSR_DATA =',
    );
    expect(dataIndex).toBeGreaterThan(-1);
    expect(shellAfter.indexOf('_SSR_DATA_READY_RESOLVE()')).toBeGreaterThan(
      dataIndex,
    );
    expect(shellBefore).toContain('<script nonce="shell-nonce">');
    expect(shellAfter).toContain('<script nonce="shell-nonce">');

    const browser = { window: {} as Window };
    const vm = createContext(browser);
    const headScript = shellBefore.match(/<script[^>]*>(.*?)<\/script>/)![1];
    runInContext(headScript, vm);
    let ready = false;
    void browser.window._SSR_DATA_READY!.then(() => {
      ready = true;
    });
    await Promise.resolve();
    expect(ready).toBe(false);
    const tailScripts = [
      ...shellAfter.matchAll(/<script[^>]*>(.*?)<\/script>/g),
    ];
    runInContext(tailScripts[tailScripts.length - 1][1], vm);
    await browser.window._SSR_DATA_READY;
    expect(ready).toBe(true);
    expect(browser.window._SSR_DATA_READY_RESOLVE).toBeUndefined();
  },
);
