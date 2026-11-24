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

const isDeclaration = (file: string) => /\.d\.[cm]?ts$/.test(file);
const isSource = (file: string) =>
  SOURCE_EXTENSIONS.includes(path.extname(file)) && !isDeclaration(file);
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
 * import, transitively.
 */
export const listProgramFiles = async ({
  appDirectory,
  tsconfigPath,
  sourceDirs,
  distDir,
  rewrite,
  scanned,
}: {
  appDirectory: string;
  tsconfigPath: string;
  sourceDirs: string[];
  distDir: string;
  rewrite?: SpecifierRewriter;
  /** Filled with each file's source and specifiers, so the compile reads and parses it once. */
  scanned?: Map<string, ScannedSource>;
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

  // Breadth first, one import level at a time, so the reads run in parallel.
  while (queue.length > 0) {
    const level = await Promise.all(
      queue.map(async file => {
        const ext = path.extname(file);
        try {
          const result = scanSpecifiers(await fs.readFile(file, 'utf8'), {
            typescript: ['.ts', '.tsx', '.mts', '.cts'].includes(ext),
            tsx: ext === '.tsx',
          });
          scanned?.set(file, result);
          return { file, specifiers: result.specifiers };
        } catch {
          // A file swc cannot parse fails the transform with a proper error.
          return { file, specifiers: [] };
        }
      }),
    );
    queue = [];
    for (const { file, specifiers } of level) {
      for (const { value: specifier } of specifiers) {
        const local = rewrite?.(file, specifier) ?? specifier;
        if (!local.startsWith('./') && !local.startsWith('../')) {
          continue;
        }
        const target = resolveFile(path.resolve(path.dirname(file), local));
        if (
          target &&
          isSource(target) &&
          !program.has(target) &&
          isInside(target, appDirectory) &&
          !isInside(target, distDir) &&
          !target.split(path.sep).includes('node_modules')
        ) {
          program.add(target);
          queue.push(target);
        }
      }
    }
  }

  return [...program];
};
