#!/usr/bin/env node
// dependency-audit — repo-wide dependency health report for Modern.js maintainers.
//
// Default behavior:
//   node scripts/audit.mjs
// If run from this skill directory, the script walks up to the Modern.js repo root.
//
// Report perspectives:
//   1) Maintainer: whole monorepo dependency health, installed size, install timing hook.
//   2) Modern user app: generated app fixture with an independent install.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
]);
const SRC_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];
const SRC_EXT_SET = new Set(SRC_EXT);
const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  'dist-ssg',
  'coverage',
  '.git',
  '.agents',
  '.nx',
  '.output',
  '.turbo',
  '.vercel',
  '.wireit',
  'compiled',
  'doc_build',
  'doc_output',
]);
const PACKAGE_NAME_RE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;

function parseArgs(argv) {
  const rest = argv.slice(2);
  const json = rest.includes('--json');
  const failOnFindings = rest.includes('--fail-on-findings');
  const measureInstall = rest.includes('--measure-install');
  const skipUserAppInstall = rest.includes('--skip-user-app-install');
  const keepUserAppFixture = rest.includes('--keep-user-app-fixture');
  const measureUserApp = !skipUserAppInstall;
  const topArg = rest.find(arg => arg.startsWith('--top='));
  const userAppArg = rest.find(arg => arg.startsWith('--user-app='));
  const dir = rest.find(arg => !arg.startsWith('--'));

  return {
    dir: resolveDefaultDir(dir),
    failOnFindings,
    json,
    keepUserAppFixture,
    measureInstall,
    measureUserApp,
    top: topArg ? Number(topArg.split('=')[1]) : 20,
    userAppDir: userAppArg ? path.resolve(userAppArg.split('=')[1]) : null,
  };
}

function resolveDefaultDir(dir) {
  if (dir) {
    return path.resolve(dir);
  }

  let cur = process.cwd();
  for (;;) {
    if (
      fs.existsSync(path.join(cur, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(cur, 'package.json'))
    ) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) return process.cwd();
    cur = parent;
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function hasPackageJson(dir) {
  return fs.existsSync(path.join(dir, 'package.json'));
}

function isMonorepoRoot(dir) {
  return fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'));
}

function walkSourceFiles(dir, root = dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      if (fullPath !== root && hasPackageJson(fullPath)) continue;
      walkSourceFiles(fullPath, root, files);
    } else if (SRC_EXT_SET.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function findPackageDirs(dir, packageDirs = []) {
  if (!fs.existsSync(dir)) return packageDirs;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (!entry.isDirectory() || SKIP_DIR.has(entry.name)) continue;

    if (hasPackageJson(fullPath)) {
      packageDirs.push(fullPath);
    }
    findPackageDirs(fullPath, packageDirs);
  }

  return packageDirs;
}

// 从源码里抽出所有 import/require/export-from/dynamic-import 的 specifier。
function extractSpecifiers(code) {
  const specs = new Set();
  const patterns = [
    /\bimport\s+[^'"]*?from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bexport\s+[^'"]*?from\s*['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(code))) specs.add(match[1]);
  }
  return specs;
}

function toPackageName(spec) {
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('#')) {
    return null;
  }
  if (/[\s${}]/.test(spec)) return null;
  if (BUILTINS.has(spec) || BUILTINS.has(spec.split('/')[0])) return null;

  const parts = spec.split('/');
  const name = spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  return PACKAGE_NAME_RE.test(name) ? name : null;
}

function resolveRelative(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [];
  if (SRC_EXT_SET.has(path.extname(base))) candidates.push(base);
  for (const ext of SRC_EXT) candidates.push(base + ext);
  for (const ext of SRC_EXT) candidates.push(path.join(base, `index${ext}`));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function findCycles(graph) {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const state = new Map();
  const stack = [];
  const cycles = [];
  const seen = new Set();

  function dfs(node) {
    state.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      const nextState = state.get(next) || WHITE;
      if (nextState === WHITE) {
        dfs(next);
      } else if (nextState === GRAY) {
        const index = stack.indexOf(next);
        if (index !== -1) {
          const cycle = stack.slice(index);
          const key = [...cycle].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cycle);
          }
        }
      }
    }
    stack.pop();
    state.set(node, BLACK);
  }

  for (const node of graph.keys()) {
    if ((state.get(node) || WHITE) === WHITE) dfs(node);
  }

  return cycles;
}

function getDeclared(pkg) {
  return new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ]);
}

function auditPackage(dir) {
  const pkgPath = path.join(dir, 'package.json');
  const pkg = readJson(pkgPath);
  const declared = getDeclared(pkg);
  const files = walkSourceFiles(dir);
  const usage = new Map();
  const graph = new Map();

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf-8');
    const edges = new Set();

    for (const spec of extractSpecifiers(code)) {
      if (spec.startsWith('.')) {
        const target = resolveRelative(file, spec);
        if (target) edges.add(target);
        continue;
      }

      const name = toPackageName(spec);
      if (!name) continue;
      if (!usage.has(name)) usage.set(name, new Set());
      usage.get(name).add(path.relative(dir, file));
    }

    graph.set(file, edges);
  }

  const phantom = [...usage.keys()]
    .filter(name => !declared.has(name) && name !== pkg.name)
    .sort()
    .map(name => ({ package: name, usedIn: [...usage.get(name)].sort() }));

  const circular = findCycles(graph).map(cycle =>
    cycle.map(file => path.relative(dir, file)),
  );

  return {
    dir,
    name: pkg.name || path.basename(dir),
    declaredCount: declared.size,
    sourceFiles: files.length,
    phantom,
    circular,
  };
}

function findLockfile(dir) {
  let cur = dir;
  for (;;) {
    const lockfile = path.join(cur, 'pnpm-lock.yaml');
    if (fs.existsSync(lockfile)) return lockfile;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

function findDuplicateVersions(lockPath) {
  const text = fs.readFileSync(lockPath, 'utf-8');
  const versions = new Map();
  const re = /^\s+'?((?:@[^@/\s]+\/)?[^@/\s']+)@(\d+\.\d+\.\d+[^':\s(]*)'?:/gm;
  let match;

  while ((match = re.exec(text))) {
    const [, name, version] = match;
    if (!versions.has(name)) versions.set(name, new Set());
    versions.get(name).add(version);
  }

  return [...versions.entries()]
    .filter(([, packageVersions]) => packageVersions.size > 1)
    .map(([name, packageVersions]) => ({
      package: name,
      versions: [...packageVersions].sort(),
    }))
    .sort((a, b) => b.versions.length - a.versions.length);
}

function findInstallRoot(dir, climb = true) {
  if (!climb) {
    return fs.existsSync(path.join(dir, 'node_modules')) ? dir : null;
  }

  let cur = dir;
  let fallback = null;
  for (;;) {
    const nodeModules = path.join(cur, 'node_modules');
    if (fs.existsSync(path.join(nodeModules, '.pnpm'))) return cur;
    if (!fallback && fs.existsSync(nodeModules)) fallback = cur;
    const parent = path.dirname(cur);
    if (parent === cur) return fallback;
    cur = parent;
  }
}

function dirSize(p) {
  let stat;
  try {
    stat = fs.lstatSync(p);
  } catch {
    return 0;
  }
  if (stat.isSymbolicLink()) return 0;
  if (stat.isFile()) return stat.size;
  if (!stat.isDirectory()) return 0;

  let total = 0;
  for (const entry of fs.readdirSync(p)) {
    total += dirSize(path.join(p, entry));
  }
  return total;
}

function parseStoreEntry(entry) {
  const cleaned = entry.replace(/[(_].*$/, '');
  if (cleaned.startsWith('@')) {
    const at = cleaned.indexOf('@', 1);
    if (at === -1) return null;
    return {
      name: cleaned.slice(0, at).replace('+', '/'),
      version: cleaned.slice(at + 1),
    };
  }
  const at = cleaned.indexOf('@');
  if (at <= 0) return null;
  return { name: cleaned.slice(0, at), version: cleaned.slice(at + 1) };
}

function measureInstalled(dir) {
  const nodeModules = path.join(dir, 'node_modules');
  if (!fs.existsSync(nodeModules)) return null;

  const store = path.join(nodeModules, '.pnpm');
  const sizes = new Map();

  if (fs.existsSync(store)) {
    for (const entry of fs.readdirSync(store)) {
      const parsed = parseStoreEntry(entry);
      if (!parsed) continue;
      const packageDir = path.join(
        store,
        entry,
        'node_modules',
        ...parsed.name.split('/'),
      );
      if (!fs.existsSync(packageDir)) continue;
      sizes.set(
        parsed.name,
        (sizes.get(parsed.name) || 0) + dirSize(packageDir),
      );
    }
  } else {
    for (const entry of fs.readdirSync(nodeModules)) {
      if (entry.startsWith('.')) continue;
      const entryPath = path.join(nodeModules, entry);
      if (entry.startsWith('@')) {
        for (const scoped of fs.readdirSync(entryPath)) {
          sizes.set(
            `${entry}/${scoped}`,
            dirSize(path.join(entryPath, scoped)),
          );
        }
      } else {
        sizes.set(entry, dirSize(entryPath));
      }
    }
  }

  return sizes;
}

function installedSizeReport(dir, top, climb = true) {
  const installRoot = findInstallRoot(dir, climb);
  const installed = installRoot ? measureInstalled(installRoot) : null;

  if (!installed) {
    return {
      installPresent: false,
      installRoot: null,
      totalBytes: null,
      largest: [],
    };
  }

  const entries = [...installed.entries()].sort((a, b) => b[1] - a[1]);
  return {
    installPresent: true,
    installRoot,
    totalBytes: entries.reduce((sum, [, bytes]) => sum + bytes, 0),
    largest: entries.slice(0, top).map(([name, bytes]) => ({ name, bytes })),
    byPackage: Object.fromEntries(installed),
  };
}

function directDependencySize(manifests, installedByPackage) {
  if (!installedByPackage) return [];
  const wanted = new Set();

  for (const manifest of manifests) {
    for (const name of Object.keys(manifest.dependencies || {}))
      wanted.add(name);
    for (const name of Object.keys(manifest.devDependencies || {})) {
      wanted.add(name);
    }
    for (const name of Object.keys(manifest.optionalDependencies || {})) {
      wanted.add(name);
    }
  }

  return [...wanted]
    .map(name => ({ name, bytes: installedByPackage[name] || 0 }))
    .sort((a, b) => b.bytes - a.bytes);
}

function workspaceVersions(repoRoot) {
  const versions = new Map();
  for (const dir of [repoRoot, ...findPackageDirs(repoRoot)]) {
    const packageJson = path.join(dir, 'package.json');
    if (!fs.existsSync(packageJson)) continue;
    const pkg = readJson(packageJson);
    if (pkg.name && pkg.version) versions.set(pkg.name, pkg.version);
  }
  return versions;
}

function renderTemplate(content, versions) {
  const modernVersion = versions.get('@modern-js/runtime') || 'latest';
  return content
    .replace(/{{packageName}}/g, 'modern-user-app')
    .replace(/{{version}}/g, modernVersion)
    .replace(/{{#unless isSubproject}}/g, '')
    .replace(/{{\/unless}}/g, '');
}

function copyRenderedTemplate(src, dest, versions) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sourcePath = path.join(src, entry.name);
    const outputName = entry.name.endsWith('.handlebars')
      ? entry.name.slice(0, -'.handlebars'.length)
      : entry.name;
    const destPath = path.join(dest, outputName);

    if (entry.isDirectory()) {
      copyRenderedTemplate(sourcePath, destPath, versions);
      continue;
    }

    if (entry.isFile()) {
      fs.writeFileSync(
        destPath,
        renderTemplate(fs.readFileSync(sourcePath, 'utf-8'), versions),
      );
    }
  }
}

function prepareGeneratedUserApp(repoRoot, keepFixture) {
  const templateDir = path.join(repoRoot, 'packages/toolkit/create/template');
  const appDir = path.join(
    repoRoot,
    keepFixture
      ? `.agents/runs/dependency-audit/user-app-fixture-${process.pid}`
      : '.agents/runs/dependency-audit/user-app-fixture',
  );

  fs.rmSync(appDir, { recursive: true, force: true });
  copyRenderedTemplate(templateDir, appDir, workspaceVersions(repoRoot));
  fs.writeFileSync(
    path.join(appDir, 'pnpm-workspace.yaml'),
    'packages:\n  - .\n',
  );
  return appDir;
}

function measureInstall(cwd) {
  const startedAt = Date.now();
  const result = spawnSync('pnpm', ['install', '--ignore-scripts'], {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 20,
  });
  const elapsedMs = Date.now() - startedAt;

  return {
    measured: true,
    command: 'pnpm install --ignore-scripts',
    exitCode: result.status,
    elapsedMs,
    realSeconds: elapsedMs / 1000,
    error: result.error ? result.error.message : null,
  };
}

function aggregatePackageReports(reports) {
  return {
    packageCount: reports.length,
    sourceFiles: reports.reduce((sum, report) => sum + report.sourceFiles, 0),
    phantomPackages: reports
      .filter(report => report.phantom.length > 0)
      .map(report => ({
        package: report.name,
        dir: report.dir,
        phantom: report.phantom,
      })),
    circularPackages: reports
      .filter(report => report.circular.length > 0)
      .map(report => ({
        package: report.name,
        dir: report.dir,
        circular: report.circular,
      })),
  };
}

function measureInstallTime(repoRoot) {
  const startedAt = Date.now();
  const result = spawnSync('pnpm', ['install', '--frozen-lockfile'], {
    cwd: repoRoot,
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 20,
  });
  const elapsedMs = Date.now() - startedAt;

  return {
    measured: true,
    command: 'pnpm install --frozen-lockfile',
    exitCode: result.status,
    elapsedMs,
    realSeconds: elapsedMs / 1000,
    error: result.error ? result.error.message : null,
  };
}

function validateInstallResult(installTime, installSize) {
  if (installTime.measured === false) return installTime;

  const errors = [];
  if (installTime.error) errors.push(installTime.error);
  if (installTime.exitCode !== 0) {
    errors.push(`install exited with code ${installTime.exitCode}`);
  }
  if (!installSize.installPresent) {
    errors.push('install did not create fixture node_modules');
  }

  return {
    ...installTime,
    error: errors.length > 0 ? errors.join('; ') : null,
    successful: errors.length === 0,
  };
}

function buildUserAppReport(repoRoot, options) {
  const appDir =
    options.userAppDir ||
    prepareGeneratedUserApp(repoRoot, options.keepUserAppFixture);
  const appAudit = auditPackage(appDir);
  const lockfile = path.join(appDir, 'pnpm-lock.yaml');
  const installTime = options.measureUserApp
    ? measureInstall(appDir)
    : {
        measured: false,
        command: 'node scripts/skills/dependency-audit/scripts/audit.mjs',
      };
  const appSize = installedSizeReport(appDir, options.top, false);
  const validatedInstallTime = validateInstallResult(installTime, appSize);
  const manifest = readJson(path.join(appDir, 'package.json'));

  return {
    fixtureDir: path.relative(repoRoot, appDir),
    generated: !options.userAppDir,
    fixtureRetention: options.userAppDir
      ? 'provided'
      : options.keepUserAppFixture
        ? 'kept'
        : 'reused',
    workspaceIsolation: options.userAppDir
      ? 'provided'
      : 'local-pnpm-workspace',
    manifestSource: path.relative(repoRoot, path.join(appDir, 'package.json')),
    app: {
      packageCount: 1,
      sourceFiles: appAudit.sourceFiles,
      phantomPackages:
        appAudit.phantom.length > 0
          ? [
              {
                package: appAudit.name,
                dir: appAudit.dir,
                phantom: appAudit.phantom,
              },
            ]
          : [],
      circularPackages:
        appAudit.circular.length > 0
          ? [
              {
                package: appAudit.name,
                dir: appAudit.dir,
                circular: appAudit.circular,
              },
            ]
          : [],
    },
    duplicateVersions: fs.existsSync(lockfile)
      ? findDuplicateVersions(lockfile)
      : [],
    installTime: validatedInstallTime,
    installSize: {
      installPresent: appSize.installPresent,
      installRoot: appSize.installRoot
        ? path.relative(repoRoot, appSize.installRoot) || '.'
        : null,
      totalBytes: appSize.totalBytes,
      largest: appSize.largest,
    },
    declaredDirectDependencySizeSource: appSize.byPackage
      ? 'user-app-install'
      : 'user-app-install-unavailable',
    declaredDirectDependencySize: directDependencySize(
      [manifest],
      appSize.byPackage,
    ).slice(0, options.top),
  };
}

function buildRepositoryReport(options) {
  const repoRoot = options.dir;
  const packageDirs = [
    repoRoot,
    ...findPackageDirs(repoRoot).filter(dir => dir !== repoRoot),
  ];
  const packageReports = packageDirs.map(dir => auditPackage(dir));
  const maintainer = aggregatePackageReports(packageReports);
  const lockfile = findLockfile(repoRoot);
  const size = installedSizeReport(repoRoot, options.top);
  const user = buildUserAppReport(repoRoot, options);

  return {
    target: repoRoot,
    mode: 'modernjs-monorepo',
    generatedAt: new Date().toISOString(),
    maintainer: {
      ...maintainer,
      lockfile: lockfile ? path.relative(repoRoot, lockfile) : null,
      duplicateVersions: lockfile ? findDuplicateVersions(lockfile) : [],
      installSize: {
        installPresent: size.installPresent,
        installRoot: size.installRoot
          ? path.relative(repoRoot, size.installRoot) || '.'
          : null,
        totalBytes: size.totalBytes,
        largest: size.largest,
      },
      installTime: options.measureInstall
        ? measureInstallTime(repoRoot)
        : {
            measured: false,
            command:
              'node scripts/skills/dependency-audit/scripts/audit.mjs --measure-install',
          },
    },
    userApp: user,
  };
}

function buildPackageReport(options) {
  const packageReport = auditPackage(options.dir);
  const lockfile = findLockfile(options.dir);
  const size = installedSizeReport(options.dir, options.top);

  return {
    target: options.dir,
    mode: 'package',
    generatedAt: new Date().toISOString(),
    package: packageReport,
    duplicateVersions: lockfile ? findDuplicateVersions(lockfile) : [],
    lockfile: lockfile ? path.relative(options.dir, lockfile) : null,
    installSize: {
      installPresent: size.installPresent,
      installRoot: size.installRoot
        ? path.relative(options.dir, size.installRoot) || '.'
        : null,
      totalBytes: size.totalBytes,
      largest: size.largest,
    },
  };
}

const mb = bytes =>
  bytes === null || bytes === undefined
    ? 'N/A'
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

function printIssueSummary(title, aggregate, rootDir) {
  console.log(`\n## ${title}`);
  console.log(
    `- packages: ${aggregate.packageCount}, source files: ${aggregate.sourceFiles}`,
  );
  console.log(
    `- phantom dependency packages: ${aggregate.phantomPackages.length}`,
  );
  console.log(
    `- circular dependency packages: ${aggregate.circularPackages.length}`,
  );

  for (const item of aggregate.phantomPackages.slice(0, 10)) {
    console.log(
      `  - ${item.package} (${path.relative(rootDir, item.dir)}): ${item.phantom
        .map(dep => dep.package)
        .slice(0, 8)
        .join(', ')}`,
    );
  }
  if (aggregate.phantomPackages.length > 10) {
    console.log(`  ...(+${aggregate.phantomPackages.length - 10} packages)`);
  }

  for (const item of aggregate.circularPackages.slice(0, 5)) {
    console.log(
      `  - ${item.package} (${path.relative(rootDir, item.dir)}): ${
        item.circular.length
      } cycles`,
    );
  }
  if (aggregate.circularPackages.length > 5) {
    console.log(`  ...(+${aggregate.circularPackages.length - 5} packages)`);
  }
}

function printRepositoryReport(report, top) {
  console.log('# dependency-audit report');
  console.log(`target: ${report.target}`);

  printIssueSummary(
    'Maintainer / whole repository',
    report.maintainer,
    report.target,
  );

  console.log(
    `- duplicate lockfile packages: ${report.maintainer.duplicateVersions.length}`,
  );
  for (const duplicate of report.maintainer.duplicateVersions.slice(0, 10)) {
    console.log(`  - ${duplicate.package}: ${duplicate.versions.join(', ')}`);
  }
  if (report.maintainer.duplicateVersions.length > 10) {
    console.log(
      `  ...(+${report.maintainer.duplicateVersions.length - 10} more)`,
    );
  }

  console.log(
    `- installed size: ${mb(report.maintainer.installSize.totalBytes)} (install root: ${
      report.maintainer.installSize.installRoot || 'not found'
    })`,
  );
  for (const item of report.maintainer.installSize.largest.slice(0, top)) {
    console.log(`  - ${item.name}: ${mb(item.bytes)}`);
  }
  console.log(
    `- install time: ${
      report.maintainer.installTime.measured === false
        ? `not measured; run ${report.maintainer.installTime.command}`
        : `${report.maintainer.installTime.realSeconds ?? 'unknown'}s (exit ${report.maintainer.installTime.exitCode})`
    }`,
  );

  printIssueSummary(
    'Modern user app perspective',
    report.userApp.app,
    report.target,
  );
  console.log(
    `- fixture: ${report.userApp.fixtureDir} (${
      report.userApp.generated ? 'generated from create template' : 'provided'
    })`,
  );
  console.log(
    `- duplicate lockfile packages: ${report.userApp.duplicateVersions.length}`,
  );
  console.log(
    `- installed size: ${mb(report.userApp.installSize.totalBytes)} (install root: ${
      report.userApp.installSize.installRoot || 'not found'
    })`,
  );
  for (const item of report.userApp.installSize.largest.slice(0, top)) {
    console.log(`  - ${item.name}: ${mb(item.bytes)}`);
  }
  console.log(
    `- install time: ${
      report.userApp.installTime.measured === false
        ? `not measured; run ${report.userApp.installTime.command}`
        : `${report.userApp.installTime.realSeconds ?? 'unknown'}s (exit ${report.userApp.installTime.exitCode})`
    }`,
  );
  console.log(`- manifest: ${report.userApp.manifestSource}`);
  console.log(
    `- declared direct dependency installed size (${report.userApp.declaredDirectDependencySizeSource}):`,
  );
  for (const item of report.userApp.declaredDirectDependencySize.slice(
    0,
    top,
  )) {
    console.log(`  - ${item.name}: ${mb(item.bytes)}`);
  }

  console.log(
    '\nNotes: phantom/cycle detection is static analysis. User app install is measured by default; use --skip-user-app-install to skip it. Use --measure-install only when you intentionally want to run pnpm install timing for the repository root too.',
  );
}

function printPackageReport(report, top) {
  console.log(`# dependency-audit package report: ${report.package.name}`);
  console.log(`target: ${report.target}`);
  console.log(`source files: ${report.package.sourceFiles}`);
  console.log(`phantom dependencies: ${report.package.phantom.length}`);
  console.log(`circular dependencies: ${report.package.circular.length}`);
  console.log(
    `duplicate lockfile packages: ${report.duplicateVersions.length}`,
  );
  console.log(`installed size: ${mb(report.installSize.totalBytes)}`);

  for (const item of report.installSize.largest.slice(0, top)) {
    console.log(`  - ${item.name}: ${mb(item.bytes)}`);
  }
}

function hasInstallFailure(installTime) {
  return (
    installTime.measured !== false &&
    (installTime.exitCode !== 0 || Boolean(installTime.error))
  );
}

function hasFindings(report) {
  if (report.mode === 'modernjs-monorepo') {
    return (
      report.maintainer.phantomPackages.length > 0 ||
      report.maintainer.circularPackages.length > 0 ||
      report.maintainer.duplicateVersions.length > 0 ||
      hasInstallFailure(report.maintainer.installTime) ||
      report.userApp.app.phantomPackages.length > 0 ||
      report.userApp.app.circularPackages.length > 0 ||
      report.userApp.duplicateVersions.length > 0 ||
      hasInstallFailure(report.userApp.installTime)
    );
  }

  return (
    report.package.phantom.length > 0 ||
    report.package.circular.length > 0 ||
    report.duplicateVersions.length > 0
  );
}

function main() {
  const options = parseArgs(process.argv);
  const repoMode = isMonorepoRoot(options.dir);
  const report = repoMode
    ? buildRepositoryReport(options)
    : buildPackageReport(options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (report.mode === 'modernjs-monorepo') {
    printRepositoryReport(report, options.top);
  } else {
    printPackageReport(report, options.top);
  }

  process.exit(options.failOnFindings && hasFindings(report) ? 1 : 0);
}

main();
