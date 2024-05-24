/**
 *
 * 处理循环引用的 replacer
 */
export const safeReplacer = () => {
  const cache: unknown[] = [];
  const keyCache: string[] = [];
  return function (key: string, value: unknown) {
    if (typeof value === 'object' && value !== null) {
      const index = cache.indexOf(value);
      if (index !== -1) {
        return `[Circular ${keyCache[index]}]`;
      }
      cache.push(value);
      keyCache.push(key || 'root');
    }
    return value;
  };
};
