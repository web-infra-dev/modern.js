import path from 'path';
import { fastGlob, fs, readTsConfigWithExtends } from '@modern-js/utils';
import {
  type ScannedSource,
  type SpecifierRewriter,
  scanSpecifiers,
} from './specifiers';
import { findNearest } from './typecheck';

// Source extensions the server compile emits.
export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];

const TS_FOR_JS: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

// Imported files tsc used to emit next to the compiled code (with
// `resolveJsonModule` / `allowJs`) that the server compile copies as they are.
const ASSET_EXTENSIONS = ['.json', '.mjs', '.cjs'];
const JS_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs'];

const isDeclaration = (file: string) => /\.d\.[cm]?ts$/.test(file);
const isSource = (file: string) =>
  SOURCE_EXTENSIONS.includes(path.extname(file)) && !isDeclaration(file);
const isAsset = (file: string) => ASSET_EXTENSIONS.includes(path.extname(file));
const isInside = (file: string, dir: string) => {
  const relative = path.relative(dir, file);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
};
const hasGlob = (entry: string) => /[*?[{]/.test(entry);

// A tsconfig `include` entry without a wildcard or an extension names a
// directory, like TypeScript reads it.
const toGlob = (entry: string) =>
  hasGlob(entry) || path.extname(entry)
    ? entry
    : `${entry.replace(/\/$/, '')}/**/*`;

const resolveFile = (target: string): string | undefined => {
  const candidates = [target];
  const ext = path.extname(target);
  for (const tsExt of TS_FOR_JS[ext] ?? []) {
    candidates.push(target.slice(0, -ext.length) + tsExt);
  }
  for (const sourceExt of SOURCE_EXTENSIONS) {
    candidates.push(`${target}${sourceExt}`);
  }
  for (const sourceExt of SOURCE_EXTENSIONS) {
    candidates.push(path.join(target, `index${sourceExt}`));
  }
  return candidates.find(
    candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
};

/**
 * The files the server compile emits, chosen like the TypeScript program the
 * compile used to build: the tsconfig `files` / `include` entries (minus
 * `exclude`) inside the server directories, plus every local file they
 * import, transitively. Imported `.json`, `.mjs` and `.cjs` files outside the
 * server directories go to `assets`, to be copied into the output.
 */
export const listProgramFiles = async ({
  appDirectory,
  tsconfigPath,
  sourceDirs,
  distDir,
  rewrite,
  scanned,
  assets,
}: {
  appDirectory: string;
  tsconfigPath: string;
  sourceDirs: string[];
  distDir: string;
  rewrite?: SpecifierRewriter;
  /** Filled with each file's source and specifiers, so the compile reads and parses it once. */
  scanned?: Map<string, ScannedSource>;
  /** Filled with the imported files outside `sourceDirs` that are copied, not compiled. */
  assets?: Set<string>;
}): Promise<string[]> => {
  const { files: configFiles } = readTsConfigWithExtends(tsconfigPath);
  const files = findNearest(configFiles, 'files');
  const include =
    findNearest(configFiles, 'include') ??
    (files
      ? undefined
      : { dir: path.dirname(path.resolve(tsconfigPath)), entries: ['**/*'] });
  const exclude = findNearest(configFiles, 'exclude');

  const roots = new Set<string>();
  for (const entry of files?.entries ?? []) {
    roots.add(path.resolve(files!.dir, entry));
  }
  if (include) {
    const ignore = [
      '**/node_modules/**',
      '**/bower_components/**',
      '**/jspm_packages/**',
      ...(exclude?.entries ?? []).map(entry =>
        path.relative(include.dir, path.resolve(exclude!.dir, toGlob(entry))),
      ),
    ].map(pattern => pattern.replace(/\\/g, '/'));
    const matched = await fastGlob(include.entries.map(toGlob), {
      cwd: include.dir,
      absolute: true,
      ignore,
      onlyFiles: true,
    });
    for (const file of matched) {
      roots.add(path.resolve(file));
    }
  }

  let queue = [...roots].filter(
    file =>
      isSource(file) &&
      fs.existsSync(file) &&
      !isInside(file, distDir) &&
      sourceDirs.some(dir => isInside(file, dir)),
  );
  const program = new Set(queue);
  const visitedAssets = new Set<string>();

  // Breadth first, one import level at a time, so the reads run in parallel.
  while (queue.length > 0) {
    const level = await Promise.all(
      queue.map(async file => {
        const ext = path.extname(file);
        if (ext === '.json') {
          return { file, specifiers: [] };
        }
        try {
          const result = scanSpecifiers(await fs.readFile(file, 'utf8'), {
            typescript: ['.ts', '.tsx', '.mts', '.cts'].includes(ext),
            tsx: ext === '.tsx',
          });
          scanned?.set(file, result);
          const specifiers = result.specifiers.map(({ value }) => value);
          // tsc follows `require()` only in JavaScript files.
          return {
            file,
            specifiers: JS_EXTENSIONS.includes(ext)
              ? [...specifiers, ...result.requires]
              : specifiers,
          };
        } catch {
          // A file swc cannot parse fails the transform with a proper error.
          return { file, specifiers: [] };
        }
      }),
    );
    queue = [];
    for (const { file, specifiers } of level) {
      for (const specifier of specifiers) {
        const local = rewrite?.(file, specifier) ?? specifier;
        if (!local.startsWith('./') && !local.startsWith('../')) {
          continue;
        }
        const target = resolveFile(path.resolve(path.dirname(file), local));
        if (
          !target ||
          !isInside(target, appDirectory) ||
          isInside(target, distDir) ||
          target.split(path.sep).includes('node_modules')
        ) {
          continue;
        }
        if (isSource(target) && !program.has(target)) {
          program.add(target);
          queue.push(target);
        } else if (isAsset(target) && !visitedAssets.has(target)) {
          visitedAssets.add(target);
          queue.push(target);
          // Files inside the server directories are copied with them.
          if (!sourceDirs.some(dir => isInside(target, dir))) {
            assets?.add(target);
          }
        }
      }
    }
  }

  return [...program];
};
