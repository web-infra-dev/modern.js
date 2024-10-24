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

export function fillResolveAndFallback(
  object: Record<string, string | null>,
  overrides: Record<string, string> = {},
) {
  const keys = Object.keys(object);
  const newObject: Record<string, string> = {};
  for (const key of keys) {
    let resultModule: string;
    if (object[key] === null) {
      resultModule = path.join(__dirname, `./mock/${key}.js`);
    } else {
      resultModule = object[key] as string;
    }
    newObject[key] = resultModule;
    if (!key.startsWith('_')) {
      newObject[`node:${key}`] = resultModule;
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
