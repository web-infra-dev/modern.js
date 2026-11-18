// Configuration guide: https://rstack.rs/config
import { execFileSync, spawnSync } from 'node:child_process';
import { define } from 'rstack';
import { modernLintPlugin } from './scripts/lint/no-unused-destructuring.mjs';

const sharedIgnores = [
  // Preserve generated files.
  '**/compiled/**',
  '**/@mf-types/**',
  'packages/runtime/plugin-runtime/static/**',
  // Skill tests exercise specific source layouts.
  'tests/skill/fixtures/**',
];

define.lint(({ js, ts }) => [
  js.configs.recommended,
  ts.configs.recommended,
  {
    plugins: { modern: modernLintPlugin },
    rules: {
      'modern/no-unused-destructuring': 'error',
    },
  },
  {
    languageOptions: {
      parserOptions: {
        // Discover package tsconfigs so rules requiring a project can run.
        projectService: true,
      },
    },
    // Disable rules with existing violations during migration; enable them gradually.
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-constant-binary-expression': 'off',
      'no-control-regex': 'off',
      'no-empty': 'off',
      'no-empty-pattern': 'off',
      'no-prototype-builtins': 'off',
      'no-unassigned-vars': 'off',
      'no-unreachable': 'off',
      'no-useless-assignment': 'off',
      'no-useless-escape': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-rest-params': 'off',
      'prefer-spread': 'off',
      'preserve-caught-error': 'off',
    },
  },
  {
    ignores: [...sharedIgnores, 'packages/toolkit/create/template/**'],
  },
]);

const testGovernanceScript = './scripts/test-governance/check.mjs';
let testGovernanceScheduled = false;
const testGovernanceCommand = () => {
  // Run once even if lint-staged splits the staged filenames into chunks.
  if (testGovernanceScheduled) return [];
  testGovernanceScheduled = true;
  return `node ${testGovernanceScript} --staged`;
};
const rstackCommand = process.argv
  .slice(2)
  .find(
    (arg, index, args) =>
      !arg.startsWith('-') && !['--config', '-c'].includes(args[index - 1]),
  );

// lint-staged does not invoke task functions for deletion-only commits.
if (
  rstackCommand === 'staged' &&
  execFileSync('git', [
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=ACMR',
    '-z',
  ]).length === 0
) {
  const result = spawnSync(
    process.execPath,
    [testGovernanceScript, '--staged'],
    { stdio: 'inherit' },
  );
  // Do not throw: the config loader retries failed imports, rerunning the check.
  if (result.error) console.error(result.error);
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

define.staged({
  '*.{md,mdx,json,json5,yml,yaml,css,less,scss,html}': 'rs fmt',
  '*.{js,jsx,ts,tsx,cjs,mjs,mts}': ['rs lint', 'rs fmt'],
  '**/package.json': ['pnpm check-dependencies'],
  // A function prevents lint-staged from appending filenames to the command.
  '*': testGovernanceCommand,
});

define.fmt({
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  ignorePatterns: [
    ...sharedIgnores,
    '*.handlebars',
    // Preserve release history.
    '**/CHANGELOG.md',
    'packages/runtime/plugin-runtime/tests/document/feature/document/_tempTsconfig.json',
    'packages/server/server/tests/fixtures/pure/test-dist/**',
    // This HTML fixture is invalid.
    'packages/solutions/app-tools/tests/analyze/fixtures/html-templates/custom-partial/config/html/head.html',
    // This legacy declaration contains a default value in a function type.
    'packages/toolkit/types/server/context.d.ts',
  ],
});
