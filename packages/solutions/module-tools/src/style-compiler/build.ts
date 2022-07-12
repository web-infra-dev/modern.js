import { CSS_EXTENSIONS, defaultCompilerOptions } from './constants';
import { resolveFiles } from './resolveFiles';
import { getFiles } from './utils';
import { IBuildOption } from './types';

export { CSS_EXTENSIONS };

export async function transformStyle(option: IBuildOption) {
  const {
    projectDir,
    stylesDir,
    outDir,
    enableVirtualDist = false,
    compilerOption = defaultCompilerOptions,
  } = option;
  // get style files
  const files = getFiles({
    stylesDir,
    extensions: CSS_EXTENSIONS,
  });

  if (enableVirtualDist) {
    return resolveFiles({
      files,
      projectDir,
      stylesDir,
      outDir,
      enableVirtualDist,
      options: compilerOption,
    });
  } else {
    await resolveFiles({
      files,
      projectDir,
      stylesDir,
      outDir,
      enableVirtualDist,
      options: compilerOption,
    });
    return undefined;
  }
}
