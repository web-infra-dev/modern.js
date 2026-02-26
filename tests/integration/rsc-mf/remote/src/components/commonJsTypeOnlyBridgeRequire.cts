const typeOnlyActionImportBridge =
  require('./typeOnlyActionImport') as typeof import('./typeOnlyActionImport');

export const COMMON_JS_TYPE_ONLY_BRIDGE_REQUIRE_MARKER =
  typeOnlyActionImportBridge.TYPE_ONLY_ACTION_IMPORT_MARKER;
