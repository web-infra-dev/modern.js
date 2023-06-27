/**
 * Converts a string to a valid variable name. If the string is already a valid variable name, returns the original string.
 * @param str - The string to convert.
 * @returns The converted string.
 */
export const toValidVarName = (str: string): string => {
  // Check if the string is a valid variable name
  if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str)) {
    return str; // If it is a valid variable name, return the original string
  } else {
    // If it is not a valid variable name, convert it to a valid variable name
    return str.replace(/[^0-9a-zA-Z_$]/g, '_').replace(/^([0-9])/, '_$1');
  }
};

/**
 * remove .html extension and validate
 * @param routePath id from pathname
 * @returns normalized id
 */
export const normalizeId = (routePath: string) => {
  const result = routePath.replace(/\.(.*)?$/, '');
  return toValidVarName(result);
};

export const injectDemoBlockImport = (str: string, path: string): string => {
  return `
    import DemoBlock from '${path}';
    ${str}
  `;
};
