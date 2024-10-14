import {
  type GlobalHooks,
  RUNTIME_GLOBALS,
  type RuntimeGlobals,
} from '@modern-js/devtools-kit/runtime';
import { Hookable } from 'hookable';

export class PluginGlobals
  extends Hookable<GlobalHooks>
  implements RuntimeGlobals
{
  static use(): PluginGlobals {
    if (!(RUNTIME_GLOBALS in window)) {
      window[RUNTIME_GLOBALS] = new PluginGlobals();
    }
    return window[RUNTIME_GLOBALS]!;
  }
}

export async function setupPlugins(scripts: string[]) {
  PluginGlobals.use();
  const scriptPromises = scripts.map(script => {
    return new Promise<void>((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.onload = () => resolve();
      scriptElement.onerror = e => reject(e);
      scriptElement.src = script;
      document.head.appendChild(scriptElement);
    });
  });
  await Promise.all(scriptPromises);
}

export { getRuntimeGlobals } from '@modern-js/devtools-kit/runtime';
