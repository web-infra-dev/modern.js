import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { readdir, readFile, realpath } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSync, traverse } from '@babel/core';
import { git } from '../check-dependencies/git-index.mjs';
import { packageImportCheck } from './public-entries.mjs';

export const allowlistPath =
  'scripts/test-governance/integration-allowlist.json';
export const approvalLabel = 'approved-new-integration-fixture';
const integrationPath = 'tests/integration';
const rules = new Map([
  [
    'internal-src-import',
    'Test through public package entries or existing tests/integration/ user flows. If neither covers the behavior, record temporary verification evidence in the PR. Do not commit internal unit tests, widen package.json exports or entry-file exports, or self-approve inline exceptions.',
  ],
  [
    'internal-module-mock',
    'Avoid internal relative-path module mocks. Verify observable behavior in an existing integration base app or a black-box pure-logic test.',
  ],
  [
    'invocation-call-order',
    'Assert observable results instead of invocationCallOrder implementation details.',
  ],
  [
    'non-rstest-runner',
    'Use Rstest for permanent tests. Keep one-off verification temporary instead of introducing another test runner.',
  ],
]);
const otherRunners = [
  'node:test',
  'bun:test',
  'jest',
  '@jest/globals',
  'vitest',
  'mocha',
  'ava',
  'tap',
  'tape',
  'uvu',
  '@playwright/test',
];
const marker = 'test-governance-allow';

export function isTestFile(path) {
  return (
    /\.[cm]?[jt]sx?$/.test(path) &&
    !/(?:^|\/)(?:fixtures?|node_modules)\//.test(path) &&
    (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path) ||
      /(?:^|\/)__tests__\//.test(path) ||
      /^(?:packages|scripts)\/.+\/tests\//.test(path))
  );
}

function exceptionsFor(comments, includesLine, today, path) {
  const exceptions = new Map();
  const diagnostics = [];
  for (const comment of comments) {
    const commentText =
      comment.type === 'CommentLine' ? `//${comment.value}` : comment.value;
    for (const [offset, text] of commentText.split('\n').entries()) {
      const line = comment.loc.start.line + offset;
      if (!includesLine(line) || !text.includes(marker)) continue;
      const match = text.match(
        /^\/\/ test-governance-allow: ([a-z-]+) \| reason: ([^|]+?) \| expires: (\d{4}-\d{2}-\d{2}) \| approved-by: @([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)\s*$/i,
      );
      let message;
      if (
        comment.type !== 'CommentLine' ||
        !match ||
        !match[2].trim() ||
        !rules.has(match[1])
      ) {
        message = `Use an inline // ${marker}: <rule> | reason: <why> | expires: YYYY-MM-DD | approved-by: @<handle> with a known rule and a nonempty reason.`;
      } else {
        const expires = match[3];
        const date = new Date(`${expires}T00:00:00.000Z`);
        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== expires
        ) {
          message =
            'The exception expiry must be a real calendar date in YYYY-MM-DD format.';
        } else if (today > expires) {
          message = `The ${match[1]} exception expired on ${expires}. Remove the violation or obtain a renewed, explained human approval.`;
        } else exceptions.set(line, match[1]);
      }
      if (message)
        diagnostics.push({ path, line, rule: 'invalid-exception', message });
    }
  }
  return { exceptions, diagnostics };
}

function stringValue(node) {
  if (node?.type === 'StringLiteral') return node.value;
  // Even a dynamic template beginning with ./ is an internal relative path.
  if (node?.type === 'TemplateLiteral') return node.quasis[0].value.cooked;
  return undefined;
}

export function checkTestSource(
  path,
  source,
  touched,
  today = new Date().toISOString().slice(0, 10),
  isInternalImport,
) {
  if (touched?.size === 0) return [];
  // Without a diff filter every line is in scope, including exception comments.
  const includesLine = line => !touched || touched.has(line);
  // Reuse the repository's declared Babel dependency, never contributor configs.
  const ast = parseSync(source, {
    filename: path,
    babelrc: false,
    configFile: false,
    parserOpts: {
      sourceType: 'unambiguous',
      plugins: [
        ...(/\.[cm]?tsx?$/.test(path) ? ['typescript'] : []),
        ...(/\.[jt]sx$/.test(path) || /\.[cm]?js$/.test(path) ? ['jsx'] : []),
      ],
    },
  });
  const { exceptions, diagnostics } = exceptionsFor(
    ast.comments || [],
    includesLine,
    today,
    path,
  );
  function report(rule, start, end = start, detail = '') {
    let firstLine;
    for (let line = start.loc.start.line; line <= end.loc.end.line; line++) {
      if (!includesLine(line)) continue;
      firstLine ??= line;
      if (exceptions.get(line) === rule) return;
    }
    if (firstLine !== undefined)
      diagnostics.push({
        path,
        line: firstLine,
        rule,
        message: detail + rules.get(rule),
      });
  }
  function checkSourceImport(start, module, value = stringValue(module)) {
    if (value && !module.expressions?.length && isInternalImport?.(value))
      report(
        'internal-src-import',
        start,
        module,
        `"${value}" accesses package source directly. `,
      );
  }
  function checkImport(start, module) {
    const value = stringValue(module);
    checkSourceImport(start, module, value);
    if (
      value &&
      otherRunners.some(
        runner => value === runner || value.startsWith(`${runner}/`),
      )
    )
      report('non-rstest-runner', start, module);
  }
  traverse(ast, {
    'CallExpression|OptionalCallExpression'({ node }) {
      const { callee, arguments: args } = node;
      if (
        ['MemberExpression', 'OptionalMemberExpression'].includes(callee.type)
      ) {
        const method = callee.computed
          ? stringValue(callee.property)
          : callee.property.name;
        if (
          ['rstest', 'rs'].includes(callee.object.name) &&
          method === 'mock' &&
          /^\.\.?\//.test(stringValue(args[0]) || '')
        )
          report('internal-module-mock', callee, args[0]);
      }
      if (
        callee.type === 'Import' ||
        (callee.type === 'Identifier' && callee.name === 'require')
      )
        checkImport(callee, args[0]);
    },
    'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'({ node }) {
      if (node.source) checkImport(node, node.source);
    },
    TSImportType({ node }) {
      checkSourceImport(node, node.argument);
    },
    TSExternalModuleReference({ node }) {
      checkSourceImport(node, node.expression);
    },
    Identifier({ node }) {
      if (node.name === 'invocationCallOrder')
        report('invocation-call-order', node);
    },
    StringLiteral({ node, parent }) {
      if (
        node.value === 'invocationCallOrder' &&
        ['MemberExpression', 'OptionalMemberExpression'].includes(
          parent.type,
        ) &&
        parent.computed &&
        parent.property === node
      )
        report('invocation-call-order', node);
    },
  });
  return diagnostics;
}

function parseAllowlist(content) {
  const entries = JSON.parse(content);
  if (
    !Array.isArray(entries) ||
    entries.some(
      entry =>
        typeof entry !== 'string' || !/^[a-z\d][a-z\d._-]*$/i.test(entry),
    ) ||
    new Set(entries).size !== entries.length
  )
    throw new Error(
      `${allowlistPath} must be a JSON array of unique top-level directory names.`,
    );
  return new Set(entries);
}

function addedLines(diff) {
  const touched = new Set();
  let line;
  for (const text of diff.split('\n')) {
    const hunk = text.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) line = Number(hunk[1]);
    else if (line !== undefined && text.startsWith('+')) touched.add(line++);
    else if (line !== undefined && text.startsWith(' ')) line++;
  }
  return touched;
}

// -z accepts literal paths (including newlines). The batch response frames each
// blob with its byte length, so decode UTF-8 only after slicing the payload.
function readGitFiles(root, revision, paths) {
  if (!paths.length) return [];
  const blobs = execFileSync(
    'git',
    ['cat-file', '--batch=%(objecttype) %(objectsize)', '-z'],
    {
      cwd: root,
      input: paths.map(path => `${revision}:${path}\0`).join(''),
      maxBuffer: Infinity,
    },
  );
  let offset = 0;
  return paths.map(path => {
    const end = blobs.indexOf(10, offset);
    const header = blobs.toString('utf8', offset, end).match(/^blob (\d+)$/);
    if (!header) throw new Error(`Cannot read Git blob ${revision}:${path}`);
    const start = end + 1;
    const size = Number(header[1]);
    offset = start + size + 1;
    return blobs.toString('utf8', start, start + size);
  });
}

function fixtureDirectories(paths) {
  return new Set(
    paths
      .filter(
        path =>
          path.startsWith(`${integrationPath}/`) && path.split('/').length > 3,
      )
      .map(path => path.split('/')[2]),
  );
}

export async function runCheck(
  root,
  {
    staged = false,
    base,
    head,
    requireApproval = false,
    labels = [],
    today,
  } = {},
) {
  if (staged && (base || head))
    throw new Error('--staged cannot be combined with --base or --head.');
  if (head && !base) throw new Error('--head requires --base.');
  const splitPaths = output => output.split('\0').filter(Boolean);
  async function revision(value) {
    return (
      await git(root, [
        'rev-parse',
        '--verify',
        '--end-of-options',
        `${value}^{commit}`,
      ])
    ).trim();
  }
  const treeMode = Boolean(base);
  const baseline = treeMode ? await revision(base) : await revision('HEAD');
  const target = treeMode ? await revision(head || 'HEAD') : undefined;
  const diffArgs = [
    'diff',
    '--no-color',
    '--no-ext-diff',
    '--no-textconv',
    '--no-renames',
  ];
  if (staged) diffArgs.push('--cached', '--ita-invisible-in-index');
  diffArgs.push(baseline);
  if (target) diffArgs.push(target);
  const basePaths = splitPaths(
    await git(root, ['ls-tree', '-r', '--name-only', '-z', baseline]),
  );
  // Apply the selected diff to the base tree. Unlike ls-files --cached, this
  // includes only real staged additions, not `git add -N` placeholders.
  const files = new Set(basePaths);
  const changed = new Set();
  const changes = splitPaths(
    await git(root, [...diffArgs, '--name-status', '-z', '--']),
  );
  for (let i = 0; i < changes.length; i += 2) {
    const status = changes[i];
    const path = changes[i + 1];
    if (status === 'U') throw new Error(`Unmerged path: ${path}`);
    if (status === 'D') files.delete(path);
    else {
      files.add(path);
      changed.add(path);
    }
  }
  const fromGit = staged || treeMode;
  const readFiles = paths =>
    fromGit
      ? readGitFiles(root, target ?? '', paths)
      : Promise.all(paths.map(path => readFile(join(root, path), 'utf8')));
  const [allowlistSource] = await readFiles([allowlistPath]);
  const allowlist = parseAllowlist(allowlistSource);
  const diagnostics = [];
  let directories;
  if (fromGit) directories = fixtureDirectories([...files]);
  else {
    const entries = await readdir(join(root, integrationPath), {
      withFileTypes: true,
    });
    directories = new Set(
      entries
        .filter(entry => entry.isDirectory() || entry.isSymbolicLink())
        .map(entry => entry.name),
    );
  }
  for (const directory of [...directories].sort()) {
    if (!allowlist.has(directory))
      diagnostics.push({
        path: `${integrationPath}/${directory}`,
        rule: 'integration-fixture',
        message: `Unregistered integration fixture. Do NOT edit ${allowlistPath} to silence this check. Merge high-risk user scenarios into existing base apps under tests/integration/ (such as basic-app, routes, ssr or server), or write a black-box pure-logic unit test. New fixtures require explicit human approval and the ${approvalLabel} PR label.`,
      });
  }
  if (requireApproval) {
    if (
      !Array.isArray(labels) ||
      labels.some(label => typeof label !== 'string')
    )
      throw new Error(
        'TEST_GOVERNANCE_PR_LABELS must be a JSON array of label names.',
      );
    const previous = basePaths.includes(allowlistPath)
      ? parseAllowlist(
          await git(root, ['show', `${baseline}:${allowlistPath}`]),
        )
      : new Set();
    const added = [...allowlist].filter(entry => !previous.has(entry));
    if (added.length && !labels.includes(approvalLabel))
      diagnostics.push({
        path: allowlistPath,
        rule: 'allowlist-approval',
        message: `Allowlist additions (${added.join(', ')}) require explicit human approval and the ${approvalLabel} PR label. Pure entry removals do not require this label. Do not add the label or change the allowlist without human approval.`,
      });
  }
  const untracked = new Set();
  if (!fromGit) {
    // -t marks skip-worktree paths S, deletions R and untracked files ?.
    // S is only an index flag: exclude the path only if it is absent on disk.
    const entries = splitPaths(
      await git(root, [
        'ls-files',
        '-t',
        '--cached',
        '--deleted',
        '--others',
        '--exclude-standard',
        '-z',
      ]),
    );
    for (const entry of entries) {
      const path = entry.slice(2);
      if (
        entry[0] === 'R' ||
        (entry[0] === 'S' &&
          !lstatSync(join(root, path), { throwIfNoEntry: false }))
      )
        files.delete(path);
      else if (entry[0] === '?') {
        untracked.add(path);
        files.add(path);
        changed.add(path);
      }
    }
  }
  const packageTests = [...files].filter(
    path => path.startsWith('packages/') && isTestFile(path),
  );
  const changedTests = [...changed].filter(
    path =>
      files.has(path) && !path.startsWith('packages/') && isTestFile(path),
  );
  if (packageTests.length) {
    const checkPackage = await packageImportCheck(
      files,
      packageTests,
      readFiles,
    );
    const sources = await readFiles(packageTests);
    for (const [i, path] of packageTests.entries())
      diagnostics.push(
        ...checkTestSource(
          path,
          sources[i],
          undefined,
          today,
          checkPackage(path),
        ),
      );
  }
  const sources = await readFiles(changedTests);
  let lines = 0;
  for (const [i, path] of changedTests.entries()) {
    const source = sources[i];
    const touched = untracked.has(path)
      ? new Set(source.split('\n').map((_, index) => index + 1))
      : addedLines(await git(root, [...diffArgs, '--unified=0', '--', path]));
    lines += touched.size;
    diagnostics.push(...checkTestSource(path, source, touched, today));
  }
  return {
    directories: directories.size,
    packageFiles: packageTests.length,
    files: changedTests.length,
    lines,
    diagnostics,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(
      'Usage: pnpm check-test-governance [--staged | --base REV [--head REV]] [--require-approval] [--json]\nWith --require-approval, TEST_GOVERNANCE_PR_LABELS must contain a JSON array of PR label names.',
    );
    return;
  }
  const options = {};
  let json = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--staged') options.staged = true;
    else if (arg === '--require-approval') options.requireApproval = true;
    else if (arg === '--json') json = true;
    else if (arg === '--base' || arg === '--head') {
      const value = args[++index];
      if (!value || value.startsWith('--'))
        throw new Error(`${arg} requires a Git revision.`);
      options[arg.slice(2)] = value;
    } else throw new Error(`Unknown argument ${arg}. Use --help for usage.`);
  }
  if (options.requireApproval)
    options.labels = JSON.parse(process.env.TEST_GOVERNANCE_PR_LABELS || '[]');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const result = await runCheck(root, options);
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    for (const diagnostic of result.diagnostics)
      console.error(
        `${diagnostic.path}${diagnostic.line ? `:${diagnostic.line}` : ''}: [${diagnostic.rule}] ${diagnostic.message}`,
      );
    console.log(
      `Checked ${result.directories} integration directories, ${result.packageFiles} full test files under packages/, and ${result.lines} changed lines in ${result.files} test files outside packages/.`,
    );
  }
  if (result.diagnostics.length) process.exitCode = 1;
}

if (
  process.argv[1] &&
  (await realpath(process.argv[1])) === fileURLToPath(import.meta.url)
) {
  main().catch(error => {
    console.error(`Test governance check failed: ${error.message}`);
    process.exitCode = 2;
  });
}
