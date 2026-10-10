import { define } from 'rstack';

define.fmt({
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  ignorePatterns: [
    '*.handlebars',
    // Preserve generated files and release history.
    '**/compiled/**',
    '**/@mf-types/**',
    '**/CHANGELOG.md',
    'packages/runtime/plugin-runtime/static/**',
    // Skill tests exercise specific source layouts; this HTML fixture is invalid.
    'tests/skill/fixtures/**',
    'packages/solutions/app-tools/tests/analyze/fixtures/html-templates/custom-partial/config/html/head.html',
    // This legacy declaration contains a default value in a function type.
    'packages/toolkit/types/server/context.d.ts',
  ],
});
