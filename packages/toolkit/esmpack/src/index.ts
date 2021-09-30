import { Compiler } from './Compiler';
import { normalizeOptions, optionsApply } from './Options';
import type { EsmpackOptions, EsmpackPlugin } from './Options';

const createCompiler = (options: EsmpackOptions) => {
  const normalizedOptions = normalizeOptions(options);
  const compiler = new Compiler(normalizedOptions);
  optionsApply(normalizedOptions, compiler);
  return compiler;
};

export const esmpack = async (options: EsmpackOptions) => {
  const compiler = createCompiler(options);
  await compiler.init();
  if (options.specifier) {
    const params = {
      specifier: options.specifier,
      importer: options.importer,
    };
    try {
      await compiler.run(params);
    } catch (e) {
      compiler.close();
      throw e;
    }
  }
  return compiler;
};

export { modifySourceBySpecifier } from './utils/modifySource';
export { getEntryFilename } from './utils/package';
export { resolve } from './utils/resolve';
export type { Compilation, CompilationParams } from './Compilation';
export type { Compiler, EsmpackOptions, EsmpackPlugin };
