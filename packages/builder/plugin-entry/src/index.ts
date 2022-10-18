import { BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import path from 'path';
import fs from 'fs-extra';
import type webpack from 'webpack';
import { searchEntry } from './searchEntry';

export interface EntrySearchOptions {
  depth?: number;
  match?: string | string[] | RegExp | RegExp[];
  preferJSX?: boolean;
  exclude?: string | string[] | RegExp | RegExp[];
  preEntry?: string | string[];
  overrideEntrySearch?: true;
  root?: string;
}

export type EntrySearch = webpack.Entry | EntrySearchOptions;

// The plugin compat eden entry search logic
// Port from '@ies/cora-webpack-v5' Entry plugin
export function PluginEntry(
  entryOptions: EntrySearch = {},
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-entry-search',
    setup(api) {
      api.modifyWebpackChain(async chain => {
        const cwd = api.context.rootPath;
        // ------ Pass on to webpack raw entry ------
        // 1. string
        // 2. array
        // 3. object && overrideEntrySearch isn't set
        if (typeof entryOptions === 'string') {
          chain.entry('index').add(path.resolve(cwd, entryOptions));
          return;
        }

        if (Array.isArray(entryOptions)) {
          entryOptions.forEach(e => {
            chain.entry(path.relative(cwd, e)).add(e);
          });
          return;
        }

        if (
          typeof entryOptions === 'object' &&
          !entryOptions.overrideEntrySearch
        ) {
          // @ts-expect-error webpack entry type
          Object.keys(entryOptions).forEach((e: keyof typeof entryOptions) => {
            if (typeof entryOptions[e] === 'object') {
              chain.entryPoints.set(e, {
                // @ts-expect-error assume input[e] as an object
                values() {
                  return entryOptions[e];
                },
              });
            } else {
              chain.entry(e).add((entryOptions as Record<string, string>)[e]);
            }
          });
          return;
        }

        // ----- Auto search entry -----
        const entrySearchOptions = entryOptions as EntrySearchOptions;
        const { preEntry, root } = entrySearchOptions;
        const srcRoot = root
          ? path.resolve(cwd, root, 'src')
          : path.resolve(cwd, 'src');
        const pagesRoot = root
          ? path.resolve(cwd, root, 'pages')
          : path.resolve(cwd, 'pages');
        const srcPagesRoot = root
          ? path.resolve(cwd, root, 'src', 'pages')
          : path.resolve(cwd, 'src', 'pages');
        let entries: string[] | null = null;
        let entrySearchDir: string | null = null;
        if (await fs.pathExists(srcPagesRoot)) {
          entrySearchDir = srcPagesRoot;
          const searchOptions = Object.assign(entrySearchOptions, {
            depth: Math.max(entrySearchOptions.depth ?? 0, 1),
          });

          entries = await searchEntry(srcPagesRoot, searchOptions);
        }
        if (!entries && (await fs.pathExists(pagesRoot))) {
          entrySearchDir = pagesRoot;
          const searchOptions = Object.assign(entrySearchOptions, {
            depth: Math.max(entrySearchOptions.depth ?? 0, 1),
          });

          entries = await searchEntry(pagesRoot, searchOptions);
        }
        if (!entries && (await fs.pathExists(srcRoot))) {
          entrySearchDir = srcRoot;
          entries = await searchEntry(srcRoot, entrySearchOptions);
        }
        if (!entries && (await fs.pathExists(cwd))) {
          entrySearchDir = cwd;
          entries = await searchEntry(cwd, entrySearchOptions);
        }

        if (!entries || !entries.length) {
          const { chalk } = await import('@modern-js/utils');
          console.error(
            `${chalk.bold.red('Error')}: ` +
              `No entries are found in ${chalk.green(
                entrySearchDir ||
                  `${srcPagesRoot} / ${pagesRoot} / ${srcRoot}${cwd}`,
              )}. `,
          );
          throw new Error('No entries are found.');
        }

        entries.forEach(e => {
          const { dir, name } = path.parse(path.relative(cwd, e));
          const entryPath = path.join(dir, name).replace(/^src[/\\]/, '');

          if (preEntry) {
            const normalizedPreEntry =
              typeof preEntry === 'string' ? [preEntry] : preEntry;

            normalizedPreEntry.forEach(pre => {
              chain.entry(entryPath).add(pre);
            });
          }

          chain.entry(entryPath).add(e);
        });
      });
    },
  };
}
