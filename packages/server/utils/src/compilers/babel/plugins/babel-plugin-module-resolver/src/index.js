import normalizeOptions from './normalizeOptions';
import resolvePath from './resolvePath';
import transformCall from './transformers/call';
import transformImport from './transformers/import';

// Public API for external plugins
export { resolvePath };

const importVisitors = {
  CallExpression: transformCall,
  'ImportDeclaration|ExportDeclaration': transformImport,
};

const visitor = {
  Program: {
    enter(programPath, state) {
      programPath.traverse(importVisitors, state);
    },
    exit(programPath, state) {
      programPath.traverse(importVisitors, state);
    },
  },
};

export default ({ types }) => ({
  name: 'module-resolver',

  manipulateOptions(opts) {
    if (opts.filename === undefined) {
      opts.filename = 'unknown';
    }
  },

  pre(file) {
    this.types = types;

    const currentFile = file.opts.filename;
    this.normalizedOpts = normalizeOptions(currentFile, this.opts);
    // We need to keep track of all handled nodes so we do not try to transform them twice,
    // because we run before (enter) and after (exit) all nodes are handled
    this.moduleResolverVisited = new Set();
  },

  visitor,

  post() {
    this.moduleResolverVisited.clear();
  },
});
