// Stands in for TypeScript 6, which reports TS5101 for a kept `baseUrl`.
const ts = require('typescript');

module.exports = {
  ...ts,
  getPreEmitDiagnostics: (...args) => [
    ...ts.getPreEmitDiagnostics(...args),
    {
      category: ts.DiagnosticCategory.Error,
      code: 5101,
      file: undefined,
      start: undefined,
      length: undefined,
      messageText:
        "Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.",
    },
  ],
};
