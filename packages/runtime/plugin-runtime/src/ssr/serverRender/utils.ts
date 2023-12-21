export function attributesToString(attributes: Record<string, any>) {
  // Iterate through the properties and convert them into a string, only including properties that are not undefined.
  return Object.entries(attributes).reduce((str, [key, value]) => {
    return value === undefined ? str : `${str} ${key}="${value}"`;
  }, '');
}

/**
 * @param source
 * @param searchValue
 * @param replaceValue
 * @returns
 */
export function safeReplace(
  source: string,
  searchValue: string | RegExp,
  replaceValue: string,
) {
  return source.replace(searchValue, () => replaceValue);
}
