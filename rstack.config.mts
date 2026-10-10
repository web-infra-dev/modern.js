import { define } from 'rstack';

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

define.staged({
  '*.{md,markdown,mdx,json,json5,jsonc,yml,yaml,css,less,scss,html,htm,vue,graphql,gql}':
    'rs fmt',
  '*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}': ['rs lint', 'rs fmt'],
  '**/package.json': ['pnpm check-dependencies'],
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
    // Generated projects still use Biome to format this stylesheet.
    'packages/toolkit/create/template/src/routes/index.css',
    // This HTML fixture is invalid.
    'packages/solutions/app-tools/tests/analyze/fixtures/html-templates/custom-partial/config/html/head.html',
    // This legacy declaration contains a default value in a function type.
    'packages/toolkit/types/server/context.d.ts',
  ],
});
