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

    const result =
      optionsByEntry !== undefined
        ? isPlainObject(optionsByEntry) && isPlainObject(baseOptions)
          ? { ...baseOptions, ...optionsByEntry }
          : optionsByEntry
        : baseOptions;
    return typeof result === 'boolean' ? ({} as T) : result;
  } else {
    return typeof baseOptions === 'boolean' ? ({} as T) : baseOptions;
  }
};

const getOptionsByEntryName = <T>(
  name: string,
  optionsByEntries: Record<string, T>,
) =>
  optionsByEntries.hasOwnProperty(name) ? optionsByEntries[name] : undefined;
