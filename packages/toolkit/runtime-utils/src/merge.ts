type PlainObject = { [key: string]: any };

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

function isObject(obj: any): obj is PlainObject {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

// Helper function to detect if an object is a complex instance (like i18next)
function isComplexInstance(obj: any): boolean {
  if (!isObject(obj)) return false;

  // Check for common complex instance indicators
  const hasMethods =
    typeof obj.init === 'function' ||
    typeof obj.changeLanguage === 'function' ||
    typeof obj.t === 'function';
  const hasInternalProps =
    obj.isInitialized !== undefined ||
    obj.language !== undefined ||
    obj.store !== undefined;

  return hasMethods || hasInternalProps;
}

export function merge<T extends PlainObject, U extends PlainObject[]>(
  target: T,
  ...sources: U
): T & UnionToIntersection<U[number]> {
  if (!sources.length) {
    return target as T & UnionToIntersection<U[number]>;
  }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      // If source[key] is a complex instance (like i18next), don't merge it deeply
      if (isComplexInstance(source[key])) {
        Object.assign(target, { [key]: source[key] });
      } else if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return merge(target, ...sources);
}
