import { build } from './build';
import { type BuildWatchEmitter, buildWatch } from './buildWatch';
import { getFinalCompilerOption } from './getFinalOption';
import type { BabelOptions, ICompilerOptions, ICompilerResult } from './type';
import { validate } from './validate';

export async function compiler(
  compilerOptions: ICompilerOptions & { enableWatch: true },
  babelOptions?: BabelOptions,
): Promise<BuildWatchEmitter>;
export async function compiler(
  compilerOptions: ICompilerOptions & { enableWatch?: false },
  babelOptions?: BabelOptions,
): Promise<ICompilerResult>;

export async function compiler(
  compilerOptions: ICompilerOptions,
  babelOptions: BabelOptions = {},
) {
  const validRet = validate(compilerOptions);

  if (validRet) {
    return validRet;
  }
  const finalCompilerOption = getFinalCompilerOption(compilerOptions);

  if (compilerOptions.enableWatch) {
    return buildWatch(finalCompilerOption, babelOptions);
  } else {
    return build(finalCompilerOption, babelOptions);
  }
}

export * from './buildWatch';
export * from './type';
