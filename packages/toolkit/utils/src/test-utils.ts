declare const expect: any;
/**
 *
 * remove the path before "modern.js"
 */
export const initSnapshotSerializer = (root: string) => {
  expect.addSnapshotSerializer({
    test: (val: string) =>
      typeof val === 'string' &&
      (val.includes('modern.js') ||
        val.includes('node_modules') ||
        val.includes(root)),
    print: (val: string) =>
      // eslint-disable-next-line no-nested-ternary
      typeof val === 'string'
        ? // eslint-disable-next-line no-nested-ternary
          val.includes('node_modules')
          ? `"${val.replace(/.+node_modules/, ``)}"`
          : val.includes('modern.js')
          ? `"${val.replace(/.+modern\.js/, ``)}"`
          : `"${val.replace(root, '')}"`
        : (val as string),
  });
};
