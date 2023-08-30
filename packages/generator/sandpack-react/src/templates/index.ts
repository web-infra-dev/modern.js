const { ModuleFiles } = require('./module');
const { MWAFiles } = require('./mwa');

export const ModernTemplates = {
  'web-app': MWAFiles,
  'npm-module': ModuleFiles,
};
