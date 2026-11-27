/**
 * React Refresh's fallback hook does not populate renderers. A remote runtime
 * injected after ReactDOM starts needs that registry to schedule its families
 * on the existing renderer. Preserve DevTools and each runtime's own families.
 */
export default function reactRefreshLoader(source: string) {
  return `${source}
if (typeof module.exports.injectIntoGlobalHook === 'function') {
  const injectRefresh = module.exports.injectIntoGlobalHook;
  module.exports.injectIntoGlobalHook = function(globalObject) {
    injectRefresh(globalObject);
    const hook = globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || hook.isDisabled || !hook.renderers) return;
    const injectRenderer = hook.inject;
    hook.inject = function(renderer) {
      const id = injectRenderer.apply(this, arguments);
      hook.renderers.set(id, renderer);
      return id;
    };
  };
}
`;
}
