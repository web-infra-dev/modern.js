import { isPlainObject } from '../is';

export const getEntryOptions = <T>(
  name: string,
  isMainEntry: boolean,
  baseOptions?: T,
  optionsByEntries?: Record<string, T>,
  packageName?: string,
) => {
  if (optionsByEntries) {
    let optionsByEntry = getOptionsByEntryName(name, optionsByEntries);

    // compatible with main entry using packageName as the key
    if (optionsByEntry === undefined && isMainEntry && packageName) {
      optionsByEntry = getOptionsByEntryName(packageName, optionsByEntries);
    }

    return optionsByEntry !== undefined
      ? isPlainObject(optionsByEntry) && isPlainObject(baseOptions)
        ? { ...baseOptions, ...optionsByEntry }
        : optionsByEntry
      : baseOptions;
  } else {
    return baseOptions;
  }
};

export const getRuntimeEntryOptions = <T>(
  name: string,
  isMainEntry: boolean,
  baseOptions?: T,
  optionsByEntries?: Record<string, T>,
  packageName?: string,
) => {
  const result = getEntryOptions(
    name,
    isMainEntry,
    baseOptions,
    optionsByEntries,
    packageName,
  );
  return typeof result === 'boolean' ? ({} as T) : result;
};

const getOptionsByEntryName = <T>(
  name: string,
  optionsByEntries: Record<string, T>,
) =>
  optionsByEntries.hasOwnProperty(name) ? optionsByEntries[name] : undefined;
