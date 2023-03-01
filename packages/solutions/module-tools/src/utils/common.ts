/**
 * transform ['a', 'b'] to {a: undefined, b: undefined}
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
