import path from 'path';

function filterObject(
  object: Record<string, string>,
  filter: (id: string) => boolean,
) {
  const filtered: Record<string, string> = {};
  Object.keys(object).forEach(key => {
    if (filter(key)) {
      filtered[key] = object[key];
    }
  });
  return filtered;
}
export function excludeObjectKeys(
  object: Record<string, string>,
  keys: string[],
) {
  return filterObject(object, key => !keys.includes(key));
}

export function addResolveFallback(
  object: Record<string, string | null>,
  overrides: Record<string, string> = {},
) {
  const keys = Object.keys(object);
  const newObject: Record<string, string> = {};
  for (const key of keys) {
    if (object[key] === null) {
      newObject[key] = path.join(__dirname, `./mock/${key}.js`);
    } else {
      newObject[key] = object[key] as string;
    }
  }

  const overridesKeys = Object.keys(overrides);
  for (const key of overridesKeys) {
    if (overrides[key]) {
      newObject[key] = overrides[key];
    }
  }

  return newObject;
}

export function addNodePrefix(
  modules: Record<string, string | null>,
): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(modules).map(([key, value]) => {
      if (!key.startsWith('_')) {
        return [`node:${key}`, value];
      }
      return [key, value];
    }),
  );
}
