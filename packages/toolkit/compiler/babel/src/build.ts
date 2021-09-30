import { fs, logger } from '@modern-js/utils';
import { defaultDistFileExtMap } from './constants';
import { compiler } from './compiler';
import type {
  IFinaleCompilerOptions,
  BabelOptions,
  ICompilerResult,
  IVirtualDist,
  ICompilerMessageDetail,
} from './type';

export const build = async (
  option: IFinaleCompilerOptions,
  babelConfig: BabelOptions = {},
): Promise<ICompilerResult> => {
  const {
    rootDir,
    enableVirtualDist,
    filenames,
    clean,
    distDir,
    distFileExtMap = defaultDistFileExtMap,
    verbose = false,
    quiet = false,
  } = option;

  const virtualDists: IVirtualDist[] = [];

  if (clean) {
    await fs.remove(distDir);
  }

  fs.ensureDir(distDir);
  const messageDetails: ICompilerMessageDetail[] = [];

  for (const filename of filenames) {
    try {
      const dist = compiler({
        rootDir,
        enableVirtualDist,
        filepath: filename,
        distDir,
        verbose,
        quiet,
        babelConfig,
        distFileExtMap,
      });
      if (enableVirtualDist && dist) {
        virtualDists.push(dist);
      }
    } catch (e: any) {
      messageDetails.push({
        filename,
        content: e.toString(),
      });
    }
  }

  const happenError = messageDetails.length > 0;

  if (!quiet) {
    if (happenError) {
      logger.error(
        `Compilation failure ${messageDetails.length} ${
          messageDetails.length !== 1 ? 'files' : 'file'
        } with Babel.`,
      );
      // TODO: 具体的报错信息打印
    } else {
      logger.info(
        `Successfully compiled ${filenames.length} ${
          filenames.length !== 1 ? 'files' : 'file'
        } with Babel.`,
      );
    }
  }

  if (happenError) {
    return {
      code: 1,
      message: `Compilation failure ${messageDetails.length} ${
        messageDetails.length !== 1 ? 'files' : 'file'
      } with Babel.`,
      messageDetails,
    };
  }

  return {
    code: 0,
    message: `Successfully compiled ${filenames.length} ${
      filenames.length !== 1 ? 'files' : 'file'
    } with Babel.`,
    virtualDists,
  };
};
