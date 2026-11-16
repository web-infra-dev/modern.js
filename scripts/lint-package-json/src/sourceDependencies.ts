import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import glob from 'fast-glob';
import ts from 'typescript';
import {
  extractReferences,
  getPackageName,
  getTypesPackageName,
} from './references';

const exec = promisify(execFile);
const ignored = [
  '**/node_modules/**',
  '**/dist/**',
  '**/compiled/**',
  '**/coverage/**',
  '**/doc_build/**',
  '**/doc_output/**',
  '**/.git/**',
  '.agents/**',
  '.claude/**',
  '.nx/**',
];

export interface PackageManifest {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  exports?: string | Record<string, unknown>;
  publishConfig?: {
    exports?: string | Record<string, unknown>;
  };
}

export interface SourceInput {
  root: string;
  files: string[];
  changed?: string[];
  read: (file: string) => Promise<string | undefined>;
}

export interface SourceIssue {
  package: string;
  file: string;
  line: number;
  dependency: string;
}

export async function createSourceInput(
  root: string,
  staged = false,
): Promise<SourceInput> {
  const files = staged
    ? (
        await exec('git', ['ls-files', '-z'], {
          cwd: root,
          maxBuffer: 20 * 1024 * 1024,
        })
      ).stdout
        .split('\0')
        .filter(Boolean)
    : await glob('**/*', {
        cwd: root,
        onlyFiles: true,
        dot: true,
        ignore: ignored,
      });
  const changed = staged
    ? (
        await exec('git', ['diff', '--cached', '--name-only', '-z'], {
          cwd: root,
        })
      ).stdout
        .split('\0')
        .filter(Boolean)
    : undefined;
  const cache = new Map<string, Promise<string | undefined>>();
  const available = new Set(files);
  const read = (file: string) => {
    let result = cache.get(file);
    if (!result) {
      result = available.has(file)
        ? staged
          ? exec('git', ['show', `:${file}`], {
              cwd: root,
              maxBuffer: 20 * 1024 * 1024,
            }).then(({ stdout }) => stdout)
          : readFile(path.join(root, file), 'utf8')
        : Promise.resolve(undefined);
      cache.set(file, result);
    }
    return result;
  };
  return { root, files, changed, read };
}

export async function readManifests(input: SourceInput) {
  const files = input.files.filter(
    file =>
      file.startsWith('packages/') &&
      file.endsWith('/package.json') &&
      !/\/(?:node_modules|compiled|dist|template|templates|fixtures)\//.test(
        file,
      ),
  );
  return Promise.all(
    files.map(async file => ({
      path: path.join(input.root, file),
      content: JSON.parse((await input.read(file))!) as PackageManifest,
    })),
  );
}

function declared(manifest: PackageManifest) {
  return new Set([
    manifest.name,
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
}

export async function checkSourceDependencies(
  input: SourceInput,
): Promise<SourceIssue[]> {
  const manifests = await readManifests(input);
  const rootManifest = JSON.parse(
    (await input.read('package.json')) ?? '{"name":"root"}',
  ) as PackageManifest;
  const rootDevelopment = declared(rootManifest);
  const configs = new Map<string, string>();
  // TypeScript's synchronous config reader can request arbitrary inherited JSON
  // filenames and package metadata. Preload these from the selected snapshot,
  // with bounded Git subprocess concurrency rather than reading the worktree.
  const pendingConfigs = input.files.filter(file => /\.jsonc?$/i.test(file));
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let file = pendingConfigs.pop(); file; file = pendingConfigs.pop()) {
        configs.set(path.join(input.root, file), (await input.read(file))!);
      }
    }),
  );
  const available = new Set(
    input.files.map(file => path.join(input.root, file)),
  );
  const repositoryFile = (file: string) => {
    const resolved =
      ts.sys.realpath?.(path.resolve(file)) ?? path.resolve(file);
    const relative = path.relative(input.root, resolved);
    return !relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative) &&
      !resolved.includes(`${path.sep}node_modules${path.sep}`)
      ? resolved
      : undefined;
  };
  const host: ts.ParseConfigFileHost = {
    ...ts.sys,
    readFile: file => {
      const indexed = configs.get(path.resolve(file));
      if (indexed !== undefined) return indexed;
      const local = repositoryFile(file);
      if (local) return configs.get(local);
      return file.includes(`${path.sep}node_modules${path.sep}`)
        ? ts.sys.readFile(file)
        : undefined;
    },
    fileExists: file => {
      if (available.has(path.resolve(file))) return true;
      const local = repositoryFile(file);
      return local ? available.has(local) : ts.sys.fileExists(file);
    },
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      );
    },
  };
  const configuration = new Map<string, ts.CompilerOptions>();
  // A shared inherited config need not be named tsconfig.json or live in the
  // changed package, so conservatively check its possible consumers.
  const configurationChanged = input.changed?.some(
    file => /\.jsonc?$/i.test(file) && !file.endsWith('package.json'),
  );
  const issues: SourceIssue[] = [];
  for (const item of manifests) {
    const directory = path.dirname(item.path);
    const relativeDirectory = path
      .relative(input.root, directory)
      .split(path.sep)
      .join('/');
    if (
      input.changed &&
      !input.changed.some(
        file =>
          file.startsWith(`${relativeDirectory}/`) ||
          file === 'package.json' ||
          configurationChanged,
      )
    )
      continue;
    const dependencies = declared(item.content);
    for (const file of input.files) {
      if (
        !file.startsWith(`${relativeDirectory}/`) ||
        !/\.[cm]?[jt]sx?$/.test(file)
      )
        continue;
      const local = file.slice(relativeDirectory.length + 1);
      if (
        /(?:^|\/)(?:node_modules|compiled|dist|fixtures|template|templates|static|doc_build)\//.test(
          local,
        )
      )
        continue;
      if (
        manifests.some(
          other =>
            other !== item &&
            path
              .join(input.root, file)
              .startsWith(`${path.dirname(other.path)}${path.sep}`),
        )
      )
        continue;
      let configDirectory = path.dirname(path.join(input.root, file));
      let configFile: string | undefined;
      while (configDirectory.startsWith(directory)) {
        const candidate = path.join(configDirectory, 'tsconfig.json');
        if (configs.has(candidate)) {
          configFile = candidate;
          break;
        }
        configDirectory = path.dirname(configDirectory);
      }
      configFile ??= path.join(input.root, 'tsconfig.json');
      if (!configuration.has(configFile)) {
        const parsed = configs.has(configFile)
          ? ts.getParsedCommandLineOfConfigFile(configFile, {}, host)
          : undefined;
        const errors =
          parsed?.errors.filter(diagnostic => diagnostic.code !== 18003) ?? [];
        if (errors.length > 0) {
          throw new Error(
            `${configFile}: ${errors
              .map(diagnostic =>
                ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
              )
              .join('\n')}`,
          );
        }
        configuration.set(configFile, parsed?.options ?? {});
      }
      const options = configuration.get(configFile)!;
      const developmentFile =
        /(?:^|\/)(?:tests?|scripts)\//.test(local) ||
        /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(local) ||
        /(?:^|\/)[^/]*config\.[cm]?[jt]s$/.test(local);
      const code = (await input.read(file))!;
      for (const reference of extractReferences(file, code)) {
        const dependency = getPackageName(reference.specifier);
        if (!dependency || dependencies.has(dependency)) continue;
        if (
          reference.typeOnly &&
          dependencies.has(getTypesPackageName(dependency))
        )
          continue;
        if (
          developmentFile &&
          (rootDevelopment.has(dependency) ||
            (reference.typeOnly &&
              rootDevelopment.has(getTypesPackageName(dependency))))
        )
          continue;
        if (options.baseUrl) {
          const candidate = path
            .relative(
              input.root,
              path.resolve(options.baseUrl, reference.specifier),
            )
            .split(path.sep)
            .join('/');
          if (
            candidate.startsWith(`${relativeDirectory}/`) &&
            input.files.some(
              target =>
                target === candidate ||
                [
                  '.ts',
                  '.tsx',
                  '.js',
                  '.d.ts',
                  '/index.ts',
                  '/index.d.ts',
                ].some(extension => target === candidate + extension),
            )
          )
            continue;
        }
        const localAlias = Object.entries(options.paths ?? {}).some(
          ([pattern, targets]) => {
            const star = pattern.indexOf('*');
            const matches =
              star < 0
                ? pattern === reference.specifier
                : reference.specifier.startsWith(pattern.slice(0, star)) &&
                  reference.specifier.endsWith(pattern.slice(star + 1));
            return (
              matches &&
              targets.every(target => {
                const resolved = path.resolve(
                  options.baseUrl ??
                    (typeof options.pathsBasePath === 'string'
                      ? options.pathsBasePath
                      : path.dirname(configFile)),
                  target,
                );
                return resolved.startsWith(`${directory}${path.sep}`);
              })
            );
          },
        );
        if (localAlias) continue;
        issues.push({
          package: item.content.name,
          file,
          line: reference.line,
          dependency,
        });
      }
    }
  }
  return issues;
}
