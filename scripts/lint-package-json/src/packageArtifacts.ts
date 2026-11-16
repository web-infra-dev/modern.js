import { execFile } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { posix } from 'node:path';
import { promisify } from 'node:util';
import { runPnpm } from './packageManager';
import {
  extractReferences,
  getPackageName,
  getTypesPackageName,
} from './references';

const execute = promisify(execFile);
const dependencyFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;
const processOptions = { maxBuffer: 16 * 1024 * 1024 };
const codeFile = /\.[cm]?[jt]sx?$/;
const declarationFile = /\.d\.[cm]?ts$/;

export interface ArtifactManifest extends Record<string, unknown> {
  name: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface ArtifactPackage {
  directory: string;
  manifest: ArtifactManifest;
}

export interface ArtifactDiagnostic {
  packageName: string;
  path: string;
  line: number;
  rule: 'artifact-entry' | 'artifact-dependency' | 'artifact-pack';
  message: string;
}

export interface PackedArtifacts {
  manifest: ArtifactManifest;
  files: ReadonlySet<string>;
  directory: string;
  cleanup: () => Promise<void>;
}

export interface ArtifactCheckResult {
  packages: number;
  diagnostics: ArtifactDiagnostic[];
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function parseArtifactManifest(code: string): ArtifactManifest {
  const value = record(JSON.parse(code));
  if (!value || typeof value.name !== 'string') {
    throw new Error('Package manifest must have a name');
  }
  if (value.version !== undefined && typeof value.version !== 'string') {
    throw new Error(`Invalid version in ${value.name}`);
  }
  for (const field of dependencyFields) {
    if (value[field] === undefined) {
      continue;
    }
    const dependencies = record(value[field]);
    if (
      !dependencies ||
      Object.values(dependencies).some(range => typeof range !== 'string')
    ) {
      throw new Error(`Invalid ${field} in ${value.name}`);
    }
  }
  if (value.private !== undefined && typeof value.private !== 'boolean') {
    throw new Error(`Invalid private flag in ${value.name}`);
  }
  return value as ArtifactManifest;
}

function compare(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function packageRelative(root: string, directory: string) {
  return relative(root, directory).split(sep).join('/');
}

/** Use pnpm's workspace graph, not a recursive manifest glob. */
export async function listArtifactWorkspacePackages(workspaceRoot: string) {
  const { stdout } = await runPnpm(['list', '-r', '--depth', '-1', '--json'], {
    ...processOptions,
    cwd: workspaceRoot,
  });
  const value: unknown = JSON.parse(stdout);
  if (!Array.isArray(value)) {
    throw new Error('pnpm list did not return a workspace package list');
  }
  const directories = new Set<string>();
  for (const entry of value) {
    const directory = record(entry)?.path;
    if (typeof directory !== 'string') {
      throw new Error('pnpm list returned a package without a directory');
    }
    directories.add(await realpath(directory));
  }
  return Promise.all(
    [...directories].sort(compare).map(async directory => ({
      directory,
      manifest: parseArtifactManifest(
        await readFile(join(directory, 'package.json'), 'utf8'),
      ),
    })),
  );
}

export function selectPublishableArtifactPackages(
  workspaceRoot: string,
  workspacePackages: readonly ArtifactPackage[],
  requestedDirectories: readonly string[] = [],
) {
  const publishable = workspacePackages.filter(
    pkg =>
      packageRelative(workspaceRoot, pkg.directory).startsWith('packages/') &&
      pkg.manifest.private !== true,
  );
  if (requestedDirectories.length === 0) {
    return publishable;
  }
  const requested = new Set(
    requestedDirectories.map(directory => resolve(workspaceRoot, directory)),
  );
  for (const directory of requested) {
    if (!publishable.some(pkg => pkg.directory === directory)) {
      throw new Error(
        `Not a publishable workspace package under packages/: ${directory}`,
      );
    }
  }
  return publishable.filter(pkg => requested.has(pkg.directory));
}

/** pnpm requires installed links for workspace: ranges, so resolve them offline. */
function publishedWorkspaceRange(
  dependencyName: string,
  range: string,
  pkg: ArtifactPackage,
  workspacePackages: readonly ArtifactPackage[],
) {
  if (!range.startsWith('workspace:')) {
    return range;
  }
  let requested = range.slice('workspace:'.length);
  let workspaceName = dependencyName;
  let dependency: ArtifactPackage | undefined;
  if (requested.startsWith('.')) {
    dependency = workspacePackages.find(
      candidate => candidate.directory === resolve(pkg.directory, requested),
    );
    workspaceName = dependency?.manifest.name ?? dependencyName;
    requested = '*';
  } else {
    const alias = /^(@[^/]+\/[^@]+|[^@]+)@(.+)$/.exec(requested);
    if (alias) {
      workspaceName = alias[1];
      requested = alias[2];
    }
    dependency = workspacePackages.find(
      candidate => candidate.manifest.name === workspaceName,
    );
  }
  if (!dependency) {
    throw new Error(`Cannot resolve ${dependencyName}@${range} in workspace`);
  }
  const version = dependency.manifest.version;
  if (!version) {
    throw new Error(`Workspace dependency ${workspaceName} has no version`);
  }
  const published =
    requested === '*'
      ? version
      : requested === '^' || requested === '~'
        ? `${requested}${version}`
        : requested;
  return workspaceName === dependencyName
    ? published
    : `npm:${workspaceName}@${published}`;
}

function isolatedManifest(
  pkg: ArtifactPackage,
  workspacePackages: readonly ArtifactPackage[],
) {
  const manifest: Record<string, unknown> = { ...pkg.manifest };
  delete manifest.scripts;
  const publishConfig = record(manifest.publishConfig);
  if (publishConfig) {
    const sanitized = { ...publishConfig };
    delete sanitized.scripts;
    manifest.publishConfig = sanitized;
  }
  for (const field of dependencyFields) {
    const dependencies = pkg.manifest[field];
    if (dependencies) {
      manifest[field] = Object.fromEntries(
        Object.entries(dependencies).map(([name, range]) => [
          name,
          publishedWorkspaceRange(name, range, pkg, workspacePackages),
        ]),
      );
    }
  }
  return manifest;
}

/** Pack built files only, with no lifecycle execution in the user's worktree. */
export async function packPackageArtifacts(
  pkg: ArtifactPackage,
  workspacePackages: readonly ArtifactPackage[],
): Promise<PackedArtifacts> {
  const temporary = await mkdtemp(join(tmpdir(), 'modern-package-artifacts-'));
  const work = join(temporary, 'work');
  const archiveDirectory = join(temporary, 'archives');
  const unpacked = join(temporary, 'unpacked');
  try {
    await cp(pkg.directory, work, {
      recursive: true,
      verbatimSymlinks: true,
      filter: source => {
        const segments = relative(pkg.directory, source).split(sep);
        return !segments.some(
          segment => segment === 'node_modules' || segment === '.git',
        );
      },
    });
    await writeFile(
      join(work, 'package.json'),
      JSON.stringify(isolatedManifest(pkg, workspacePackages), null, 2),
    );
    await Promise.all([
      mkdir(archiveDirectory),
      mkdir(unpacked),
      // A local workspace boundary prevents pnpm from using an ancestor workspace.
      writeFile(
        join(temporary, 'pnpm-workspace.yaml'),
        'packages:\n  - work\n',
      ),
    ]);
    const { stdout } = await runPnpm(
      ['pack', '--json', '--pack-destination', archiveDirectory],
      { ...processOptions, cwd: work },
    );
    const filename = record(JSON.parse(stdout))?.filename;
    if (
      typeof filename !== 'string' ||
      resolve(filename) === archiveDirectory ||
      !resolve(filename).startsWith(`${archiveDirectory}${sep}`)
    ) {
      throw new Error('pnpm pack did not return an isolated tarball path');
    }
    const { stdout: listing } = await execute(
      'tar',
      ['-tzf', filename],
      processOptions,
    );
    const files = new Set<string>();
    for (const entry of listing.split(/\r?\n/).filter(Boolean)) {
      if (!entry.startsWith('package/') || entry.split('/').includes('..')) {
        throw new Error(`Unexpected packed archive path: ${entry}`);
      }
      if (!entry.endsWith('/')) {
        files.add(entry.slice('package/'.length));
      }
    }
    // These are trusted, repo-generated archives, never installed or executed.
    await execute('tar', ['-xzf', filename, '-C', unpacked], processOptions);
    const directory = join(unpacked, 'package');
    return {
      directory,
      files,
      manifest: parseArtifactManifest(
        await readFile(join(directory, 'package.json'), 'utf8'),
      ),
      cleanup: () => rm(temporary, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

function safePackedPath(target: string) {
  if (isAbsolute(target) || target.includes('\\')) {
    return null;
  }
  const normalized = posix.normalize(target);
  return normalized === '..' || normalized.startsWith('../')
    ? null
    : normalized.replace(/^\.\//, '');
}

function matchesTarget(target: string, files: ReadonlySet<string>) {
  const path = safePackedPath(target);
  if (!path) {
    return [];
  }
  if (!path.includes('*')) {
    return files.has(path) ? [path] : [];
  }
  const pattern = new RegExp(
    `^${path
      .split('*')
      .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`,
  );
  return [...files].filter(file => pattern.test(file)).sort(compare);
}

function extensionCandidates(path: string, types: boolean) {
  const candidates = [path];
  if (types) {
    const extension = /\.(mjs|cjs|js)$/.exec(path)?.[1];
    if (extension) {
      const base = path.slice(0, -extension.length - 1);
      candidates.unshift(
        `${base}.d.${extension === 'mjs' ? 'mts' : extension === 'cjs' ? 'cts' : 'ts'}`,
        `${base}.${extension === 'mjs' ? 'mts' : extension === 'cjs' ? 'cts' : 'ts'}`,
      );
    }
  }
  if (!posix.extname(path)) {
    const extensions = types
      ? ['.d.ts', '.d.mts', '.d.cts', '.ts', '.tsx', '.js', '.mjs', '.cjs']
      : ['.js', '.mjs', '.cjs', '.json', '.node'];
    candidates.push(...extensions.map(extension => `${path}${extension}`));
  }
  return candidates;
}

/** The file set and reader must both come from the packed tarball. */
export async function inspectPackageArtifacts(
  manifest: ArtifactManifest,
  files: ReadonlySet<string>,
  readPackedFile: (path: string) => Promise<string>,
): Promise<ArtifactDiagnostic[]> {
  const diagnostics: ArtifactDiagnostic[] = [];
  const diagnosticKeys = new Set<string>();
  // A public .ts types entry is type-only, but an actual .ts runtime export is not.
  const roots = new Map<string, boolean>();
  const addRoot = (path: string, types = false, nodeBinary = false) => {
    if (codeFile.test(path) || nodeBinary) {
      roots.set(
        path,
        declarationFile.test(path) || (types && roots.get(path) !== false),
      );
    }
  };
  const contents = new Map<string, Promise<string>>();
  const read = (path: string) => {
    let content = contents.get(path);
    if (!content) {
      content = readPackedFile(path);
      contents.set(path, content);
    }
    return content;
  };
  const report = (
    rule: ArtifactDiagnostic['rule'],
    path: string,
    line: number,
    message: string,
  ) => {
    const key = JSON.stringify([path, line, rule, message]);
    if (!diagnosticKeys.has(key)) {
      diagnostics.push({
        packageName: manifest.name,
        path,
        line,
        rule,
        message,
      });
      diagnosticKeys.add(key);
    }
  };

  const resolveLocal = async (
    target: string,
    types: boolean,
    visited = new Set<string>(),
  ): Promise<string | null> => {
    const path = safePackedPath(target);
    if (!path || visited.has(path)) {
      return null;
    }
    visited.add(path);
    for (const candidate of extensionCandidates(path, types)) {
      if (files.has(candidate)) {
        return candidate;
      }
    }
    const nestedManifest = `${path}/package.json`;
    if (files.has(nestedManifest)) {
      const value = record(JSON.parse(await read(nestedManifest)));
      for (const field of types ? ['types', 'typings', 'main'] : ['main']) {
        const nestedTarget = value?.[field];
        if (typeof nestedTarget === 'string') {
          const resolved = await resolveLocal(
            posix.join(path, nestedTarget),
            types,
            visited,
          );
          if (resolved) {
            return resolved;
          }
        }
      }
    }
    for (const candidate of extensionCandidates(`${path}/index`, types)) {
      if (files.has(candidate)) {
        return candidate;
      }
    }
    return null;
  };

  const entry = async (
    field: string,
    target: unknown,
    types = false,
    exact = false,
  ) => {
    if (typeof target !== 'string') {
      report(
        'artifact-entry',
        'package.json',
        1,
        `${field} must target a file`,
      );
      return false;
    }
    const matched = matchesTarget(target, files);
    if (!exact && matched.length === 0 && !target.includes('*')) {
      const resolved = await resolveLocal(target, types);
      if (resolved) {
        matched.push(resolved);
      }
    }
    if (matched.length === 0) {
      report(
        'artifact-entry',
        'package.json',
        1,
        `${field} target ${JSON.stringify(target)} is not in the packed files (check build output and files allowlist)`,
      );
      return false;
    }
    for (const path of matched) {
      const binTarget = field === 'bin' || field.startsWith('bin.');
      const nodeBinary =
        binTarget &&
        !codeFile.test(path) &&
        /^#!\s*(?:\S*[/\\])?(?:node(?:js|\.exe)?(?:\s|$)|env\s+(?:-S\s+)?node(?:js|\.exe)?(?:\s|$))/.test(
          (await read(path)).split(/\r?\n/, 1)[0],
        );
      addRoot(path, types, nodeBinary);
    }
    return true;
  };

  for (const field of ['main', 'module', 'types', 'typings']) {
    // @modern-js/types deliberately publishes main: "" to unset its runtime entry.
    if (
      manifest[field] !== undefined &&
      !(field === 'main' && manifest.main === '')
    ) {
      await entry(
        field,
        manifest[field],
        field === 'types' || field === 'typings',
      );
    }
  }
  if (manifest.bin !== undefined) {
    if (typeof manifest.bin === 'string') {
      await entry('bin', manifest.bin, false, true);
    } else {
      const bins = record(manifest.bin);
      if (!bins) {
        await entry('bin', manifest.bin, false, true);
      } else {
        for (const [name, target] of Object.entries(bins)) {
          await entry(`bin.${name}`, target, false, true);
        }
      }
    }
  }

  type ExportOutcome = 'target' | 'null' | 'undefined' | 'invalid';
  const exportsEntries = async (
    value: unknown,
    field: string,
    types = false,
    catchesInvalid = false,
  ): Promise<Set<ExportOutcome>> => {
    if (value === null) return new Set(['null']);
    if (typeof value === 'string') {
      if (!value.startsWith('./')) {
        if (!catchesInvalid)
          report(
            'artifact-entry',
            'package.json',
            1,
            `${field} has a non-local export target ${JSON.stringify(value)}`,
          );
        return new Set(['invalid']);
      }
      await entry(field, value, types, true);
      // A valid target ends resolution even if the target file is absent.
      return new Set(['target']);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return new Set(['null']);
      let remaining = new Set<ExportOutcome>(['undefined']);
      let resolves = false;
      for (const [index, candidate] of value.entries()) {
        const outcomes = await exportsEntries(
          candidate,
          `${field}[${index}]`,
          types,
          true,
        );
        resolves ||= outcomes.has('target');
        const next = new Set<ExportOutcome>(
          [...outcomes].filter(
            outcome => outcome !== 'target' && outcome !== 'undefined',
          ),
        );
        // An unmatched conditional leaves the previous fallback/error intact.
        if (outcomes.has('undefined'))
          for (const outcome of remaining) next.add(outcome);
        remaining = next;
        if (remaining.size === 0) break;
      }
      if (remaining.has('invalid') && !catchesInvalid)
        report(
          'artifact-entry',
          'package.json',
          1,
          `${field} has an invalid export target without a resolving fallback`,
        );
      if (resolves) remaining.add('target');
      return remaining;
    }
    const conditions = record(value);
    if (!conditions) {
      if (!catchesInvalid) await entry(field, value, false, true);
      return new Set(['invalid']);
    }
    const outcomes = new Set<ExportOutcome>(['undefined']);
    for (const [condition, target] of Object.entries(conditions)) {
      if (!outcomes.has('undefined')) break;
      // This source condition is enabled only by workspace tests. Unknown
      // conditions remain applicable and their reachable targets are checked.
      if (condition === 'modern:source') continue;
      const child = await exportsEntries(
        target,
        `${field}.${condition}`,
        types || condition === 'types' || condition.startsWith('types@'),
        catchesInvalid,
      );
      // default always matches. Other conditions retain a possible unmatched
      // branch, while resolved/null/error branches never evaluate later keys.
      if (condition === 'default') outcomes.delete('undefined');
      for (const outcome of child) outcomes.add(outcome);
    }
    return outcomes;
  };
  if (manifest.exports !== undefined) {
    await exportsEntries(manifest.exports, 'exports');
  }
  const versions = record(manifest.typesVersions);
  if (manifest.typesVersions !== undefined && !versions) {
    report(
      'artifact-entry',
      'package.json',
      1,
      'typesVersions must contain version mappings',
    );
  }
  for (const [version, mappings] of Object.entries(versions ?? {})) {
    const paths = record(mappings);
    if (!paths) {
      report(
        'artifact-entry',
        'package.json',
        1,
        `typesVersions.${version} must contain path mappings`,
      );
      continue;
    }
    for (const [subpath, targets] of Object.entries(paths)) {
      const field = `typesVersions.${version}.${subpath}`;
      if (
        !Array.isArray(targets) ||
        !targets.every(target => typeof target === 'string')
      ) {
        report(
          'artifact-entry',
          'package.json',
          1,
          `${field} must contain file targets`,
        );
        continue;
      }
      let found = false;
      for (const target of targets) {
        const matched = matchesTarget(target, files);
        if (matched.length === 0 && !target.includes('*')) {
          const resolved = await resolveLocal(target, true);
          if (resolved) {
            matched.push(resolved);
          }
        }
        if (matched.length > 0) {
          matched.forEach(path => addRoot(path, true));
          found = true;
          break;
        }
      }
      if (!found) {
        report(
          'artifact-entry',
          'package.json',
          1,
          `${field} has no target in the packed files: ${JSON.stringify(targets)}`,
        );
      }
    }
  }
  // Legacy packages with no explicit runtime entry expose index.js by default.
  if (
    (manifest.main === undefined || manifest.main === '') &&
    manifest.exports === undefined &&
    files.has('index.js')
  ) {
    addRoot('index.js');
  }

  const production = new Set(
    ['dependencies', 'peerDependencies', 'optionalDependencies'].flatMap(
      field => Object.keys(record(manifest[field]) ?? {}),
    ),
  );
  const visited = new Set<string>();
  const pending = [...roots].sort((left, right) => compare(left[0], right[0]));
  while (pending.length > 0) {
    const current = pending.shift();
    if (!current) {
      continue;
    }
    const [path, typeContext] = current;
    const visitKey = `${typeContext}\0${path}`;
    if (visited.has(visitKey)) {
      continue;
    }
    visited.add(visitKey);
    const code = await read(path);
    for (const reference of extractReferences(path, code)) {
      const { specifier, line, optional } = reference;
      // Caught resolution probes can detect a development/host tool without loading it.
      // Actual imports/requires still need production declarations, even when caught.
      if (optional && reference.resolutionOnly) continue;
      const typeOnly = typeContext || reference.typeOnly === true;
      if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const local = await resolveLocal(
          posix.join(posix.dirname(path), specifier),
          typeOnly,
        );
        if (local && codeFile.test(local)) {
          pending.push([local, typeOnly || declarationFile.test(local)]);
        }
        // Follow packaged files to check their external dependency declarations.
        // Full local-module/type resolution is covered by integration tests, not
        // this manifest-entry gate.
        continue;
      }
      const packageName = getPackageName(specifier);
      if (
        !packageName ||
        packageName === manifest.name ||
        production.has(packageName)
      ) {
        continue;
      }
      const typeProvider = typeOnly ? getTypesPackageName(packageName) : null;
      if (typeProvider && production.has(typeProvider)) {
        continue;
      }
      const devProvider =
        manifest.devDependencies?.[packageName] !== undefined
          ? packageName
          : typeProvider &&
              manifest.devDependencies?.[typeProvider] !== undefined
            ? typeProvider
            : null;
      if (devProvider) {
        report(
          'artifact-dependency',
          path,
          line,
          `${JSON.stringify(specifier)} is required by published ${typeOnly ? 'types' : 'code'} but ${devProvider} is only in devDependencies`,
        );
      } else if (!optional) {
        report(
          'artifact-dependency',
          path,
          line,
          `${JSON.stringify(specifier)} is required by published ${typeOnly ? 'types' : 'code'} but ${packageName} has no dependencies, peerDependencies or optionalDependencies declaration`,
        );
      }
    }
  }
  return diagnostics.sort(
    (left, right) =>
      compare(left.packageName, right.packageName) ||
      compare(left.path, right.path) ||
      left.line - right.line ||
      compare(left.rule, right.rule) ||
      compare(left.message, right.message),
  );
}

export async function checkPackageArtifacts(
  workspaceRoot: string,
  requestedDirectories: readonly string[] = [],
): Promise<ArtifactCheckResult> {
  const root = await realpath(workspaceRoot);
  const workspacePackages = await listArtifactWorkspacePackages(root);
  const requested = await Promise.all(
    requestedDirectories.map(directory => realpath(resolve(root, directory))),
  );
  const packages = selectPublishableArtifactPackages(
    root,
    workspacePackages,
    requested,
  );
  const diagnostics: ArtifactDiagnostic[] = [];
  for (const pkg of packages) {
    let packed: PackedArtifacts | undefined;
    try {
      packed = await packPackageArtifacts(pkg, workspacePackages);
      const archive = packed;
      diagnostics.push(
        ...(await inspectPackageArtifacts(
          archive.manifest,
          archive.files,
          path => readFile(join(archive.directory, path), 'utf8'),
        )),
      );
    } catch (error) {
      diagnostics.push({
        packageName: pkg.manifest.name,
        path: 'package.json',
        line: 1,
        rule: 'artifact-pack',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await packed?.cleanup();
    }
  }
  return { packages: packages.length, diagnostics };
}
