/**
 * When merging config, some properties prefer `override` rather than `merge to array`
 */
export const isOverriddenConfigKey = (key: string) =>
  [
    'removeConsole',
    'enableInlineScripts',
    'enableInlineStyles',
    'baseUrl',
  ].includes(key);
