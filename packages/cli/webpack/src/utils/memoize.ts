export function memoize<T>(fn: (...args: any[]) => T) {
  const memoized = function (this: any, ...args: any[]) {
    const key = args[0];

    const { cache } = memoized;

    if (cache.has(key)) {
      return cache.get(key) as T;
    }

    // eslint-disable-next-line @babel/no-invalid-this
    const res = fn.apply(this, args);

    memoized.cache.set(key, res);

    return res;
  };

  memoized.cache = new Map<string, T>();

  return memoized;
}
