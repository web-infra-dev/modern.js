type PlainObject = { [key: string]: any };

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

function isObject(obj: any): obj is PlainObject {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
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
      if (isObject(source[key])) {
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
