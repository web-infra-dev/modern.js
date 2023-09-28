export const CSS_CHUNKS_PLACEHOLDER = '<!--<?- chunksMap.css ?>-->';

export const SSR_DATA_JSON_ID = '__MODERN_SSR_DATA__';

export const ROUTER_DATA_JSON_ID = '__MODERN_ROUTER_DATA__';

export function attributesToString(attributes: Record<string, any>) {
  // Iterate through the properties and convert them into a string, only including properties that are not undefined.
  return Object.entries(attributes).reduce((str, [key, value]) => {
    return value === undefined ? str : `${str} ${key}="${value}"`;
  }, '');
}
