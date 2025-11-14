import type { TInternalRuntimeContext, TRuntimeContext } from '../context';

export function transformHookRunner(hookRunnerName: string) {
  switch (hookRunnerName) {
    case 'beforeRender':
      return 'onBeforeRender';
    default:
      return hookRunnerName;
  }
}
export function handleSetupResult(
  setupResult: Record<string, (...args: any) => any>,
  api: Record<string, any>,
) {
  if (!setupResult) {
    return;
  }
  Object.keys(setupResult).forEach(key => {
    const fn = setupResult[key];
    if (typeof fn === 'function') {
      const newAPI = transformHookRunner(key);
      if (api[newAPI]) {
        if (key === 'beforeRender') {
          api[newAPI](async (...params: any) => {
            await fn(...params);
          });
        } else {
          api[newAPI]((...params: any) => {
            const res = fn(...params);
            return res;
          });
        }
      }
    }
  });
}

export function getHookRunners(
  runtimeContext: TInternalRuntimeContext,
): Record<string, any> {
  const { _internalContext } = runtimeContext;
  const { hooks } = _internalContext;
  return {
    beforeRender: async (context: any) => {
      return hooks.onBeforeRender.call(context);
    },
    wrapRoot: (App: React.ComponentType) => {
      return hooks.wrapRoot.call(App);
    },
    pickContext: (context: TRuntimeContext) => {
      return hooks.pickContext.call(context);
    },
    config: () => {
      return hooks.config.call();
    },
  };
}
