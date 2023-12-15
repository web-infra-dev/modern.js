export function attributesToString(attributes: Record<string, any>) {
  // Iterate through the properties and convert them into a string, only including properties that are not undefined.
  return Object.entries(attributes).reduce((str, [key, value]) => {
    return value === undefined ? str : `${str} ${key}="${value}"`;
  }, '');
}

/**
 * It is unsafe unsafeReplace, only support serachValue exsit one time.
 * @param source
 * @param searchValue
 * @param replaceValue
 * @returns
 */
export function unsafeReplace(
  source: string,
  searchValue: RegExp | string,
  replaceValue: string,
) {
  const [s1, s2] = source.split(searchValue);
  if (typeof s2 === 'undefined') {
    // if s2 === 'undefined', it means we can't find `searchValue`.
    // so we only need return s1.
    return s1;
  } else {
    return s1 + replaceValue + s2;
  }
}
