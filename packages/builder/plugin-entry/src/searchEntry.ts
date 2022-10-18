import fs from 'fs-extra';
import path from 'path';
import type { EntrySearchOptions } from '.';

const DEFAULT_ENTRY_PATTERNS = [/index.(j|t)sx?$/];
const BLOCK_FILE_LIST = ['node_modules', '.git'];

export function normalizeToArray<T>(from: T | T[]): T[] {
  if (Array.isArray(from)) {
    return from;
  }

  return [from];
}

async function searchDirectory(
  directory: string,
  options: EntrySearchOptions = {},
  entries: string[] = [],
  currentDepth = 0,
): Promise<string[]> {
  const {
    depth: maxDepth = 0,
    match: entryPattern = DEFAULT_ENTRY_PATTERNS,
    preferJSX = false,
    exclude = [],
  } = options;
  const searchedEntries = [] as string[];

  if (currentDepth > maxDepth) {
    return entries;
  }

  const fileList = (await fs.readdir(directory)).filter(
    file => !BLOCK_FILE_LIST.includes(file),
  );

  if (fileList.length === 0) {
    return entries;
  }

  const normalizedEntryNames = normalizeToArray<string | RegExp>(entryPattern);
  const normalizedExclude = normalizeToArray<string | RegExp>(exclude);

  for (const file of fileList) {
    const filepath = path.resolve(directory, file);
    const stat = await fs.stat(filepath);

    if (stat.isDirectory()) {
      await searchDirectory(filepath, options, entries, currentDepth + 1);
    } else if (
      // An entry must be matched by at least one pattern defined in `entryNames`
      normalizedEntryNames.some(pattern =>
        typeof pattern === 'string'
          ? filepath.includes(pattern)
          : pattern.test(filepath),
      ) &&
      // An entry must NOT be matched by any pattern defined in `exclude`
      normalizedExclude.every(pattern =>
        typeof pattern === 'string'
          ? !filepath.includes(pattern)
          : !pattern.test(filepath),
      )
    ) {
      searchedEntries.push(filepath);
    }
  }

  const entryMap: Record<string, string[]> = searchedEntries.reduce(
    (map, entryName) => {
      const { name, ext } = path.parse(entryName);

      if (typeof map[name] === 'undefined') {
        map[name] = [ext];
      } else {
        map[name].push(ext);
      }

      return map;
    },
    {} as Record<string, string[]>,
  );

  Object.keys(entryMap).forEach(name => {
    if (entryMap[name].length > 1) {
      entryMap[name] = [
        entryMap[name].find(n =>
          preferJSX ? n.endsWith('x') : !n.endsWith('x'),
        ) ?? '.js',
      ];
    }
  });

  Object.keys(entryMap).forEach(name =>
    entries.push(path.resolve(directory, `${name}${entryMap[name].join('')}`)),
  );

  return entries;
}

export async function searchEntry(
  from: string,
  options?: EntrySearchOptions,
): Promise<string[]> {
  return searchDirectory(from, options);
}
