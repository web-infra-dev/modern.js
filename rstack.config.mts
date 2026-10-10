import { define } from 'rstack';

define.fmt({
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  ignorePatterns: [
    '*.handlebars',
    // Preserve fixture contents, generated files, and release history.
    '**/fixture/**',
    '**/fixtures/**',
    '**/compiled/**',
    '**/@mf-types/**',
    '**/test-results/**',
    '**/CHANGELOG.md',
    'packages/toolkit/create/template/**',
    'packages/toolkit/sandpack-react/src/templates/**',
    'packages/runtime/plugin-runtime/static/**',
    // This legacy declaration contains a default value in a function type.
    'packages/toolkit/types/server/context.d.ts',
  ],
});
