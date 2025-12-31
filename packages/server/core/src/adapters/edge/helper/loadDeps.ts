export const loadDeps = async <T = any>(
  keyParam: string,
  deps?: Record<string, Promise<any>>,
): Promise<T | undefined> => {
  if (!deps || typeof deps !== 'object') {
    return;
  }

  let key = keyParam;
  if (key.startsWith('/')) {
    key = key.substring(1);
  }

  let value: any;
  if (deps.hasOwnProperty(key)) {
    value = deps[key];
  } else {
    const s = ['.js', '.json', '.mjs'].find(x => deps.hasOwnProperty(key + x));
    if (s) {
      value = deps[s];
    }
  }

  if (typeof value !== 'function') {
    return;
  }

  try {
    return await value();
  } catch (e) {
    console.error(e);
  }
};
