/**
 * transform ['a', 'b'] to { a: undefined, b: undefined }
 */
export const transformUndefineObject = (
  arr: string[],
): Record<string, undefined> => {
  return arr.reduce((o, key) => {
    return {
      ...o,
      [key]: undefined,
    };
  }, {});
};

export function mapValue<T = any, U = any>(
  obj: Record<string, T>,
  mapper: (x: T) => U,
): Record<string, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, mapper(value)]),
  );
}
