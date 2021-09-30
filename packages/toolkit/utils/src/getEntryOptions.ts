import { isPlainObject } from './is';

export const getEntryOptions = <T>(
  name: string,
  baseOptions?: T,
  optionsByEntries?: Record<string, T>,
) => {
  if (optionsByEntries) {
    // eslint-disable-next-line no-nested-ternary
    return optionsByEntries.hasOwnProperty(name)
      ? isPlainObject(optionsByEntries[name]) && isPlainObject(baseOptions)
        ? { ...baseOptions, ...optionsByEntries[name] }
        : optionsByEntries[name]
      : baseOptions;
  } else {
    return baseOptions;
  }
};
