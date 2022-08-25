import type webpack from 'webpack';

function isDependencyWarning(warning: Error) {
  return warning.name === 'ModuleDependencyWarning';
}

function sortWarnings(compilation: webpack.Compilation) {
  const errors = compilation.errors.slice(0);
  const warnings: webpack.WebpackError[] = [];

  compilation.warnings.forEach(item => {
    if (isDependencyWarning(item)) {
      errors.push(item);
    } else {
      warnings.push(item);
    }
  });

  compilation.errors = errors;
  compilation.warnings = warnings;
}

/**
 * Convert webpack `ModuleDependencyWarning` to an error
 * such "export 'xxx' was not found in 'xxx"
 */
export class ModuleDependencyErrorPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.shouldEmit.tap(
      'ModuleDependencyErrorPlugin',
      this.convertWarnings,
    );
  }

  convertWarnings(compilation: webpack.Compilation) {
    if (compilation.warnings.length > 0) {
      sortWarnings(compilation);
    }

    compilation.children.forEach(child => {
      if (child.warnings.length > 0) {
        sortWarnings(child);
      }
    });

    return true;
  }
}
