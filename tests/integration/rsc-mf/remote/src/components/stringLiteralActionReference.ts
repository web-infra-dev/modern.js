const actionReferenceText = "require('./actions')";
const dynamicImportText = "import('./actions')";
const exportFromText = "export * from './actions'";

export const STRING_LITERAL_ACTION_REFERENCE = [
  actionReferenceText,
  dynamicImportText,
  exportFromText,
].join('|');
