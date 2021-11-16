import * as path from 'path';
import * as babel from '@babel/core';
import { logger, fs } from '@modern-js/utils';
import * as utils from './utils';
import { BabelOptions, IVirtualDist } from './type';
import { defaultDistFileExtMap } from './constants';

export interface ISingleFileCompilerOption {
  filepath: string;
  rootDir: string;
  enableVirtualDist?: boolean;
  distDir?: string;
  verbose?: boolean;
  quiet?: boolean;
  babelConfig?: BabelOptions;
  distFileExtMap?: Record<string, string>;
}

const defaultDistDir = 'dist';

export const isRes = (
  r: babel.BabelFileResult | null,
): r is babel.BabelFileResult => Boolean(r);

export const getDistFilePath = (option: {
  filepath: string;
  rootDir: string;
  distDir: string;
  extMap: Record<string, string>;
}) => {
  const { filepath, rootDir, distDir, extMap } = option;
  const ext = path.extname(filepath);
  return path.join(
    distDir,
    path.relative(rootDir, filepath).replace(ext, extMap[ext]),
  );
};

export const resolveSourceMap = (option: {
  babelRes: babel.BabelFileResult;
  distFilePath: string;
  enableVirtualDist?: boolean;
}) => {
  const { babelRes, distFilePath, enableVirtualDist = false } = option;
  const mapLoc = `${distFilePath}.map`;
  babelRes.code = utils.addSourceMappingUrl(babelRes.code as string, mapLoc);

  if (babelRes.map) {
    babelRes.map.file = path.basename(distFilePath);
  }

  const sourceMapVirtualDist = {
    sourcemap: JSON.stringify(babelRes.map),
    sourceMapPath: mapLoc,
  };

  if (enableVirtualDist) {
    return sourceMapVirtualDist;
  }

  fs.ensureDirSync(path.dirname(mapLoc));
  fs.writeFileSync(mapLoc, JSON.stringify(babelRes.map));

  return sourceMapVirtualDist;
};

export const compiler = (option: ISingleFileCompilerOption) => {
  const {
    filepath,
    rootDir,
    enableVirtualDist = false,
    distDir = path.join(path.dirname(rootDir), defaultDistDir),
    verbose = false,
    babelConfig = {},
    distFileExtMap = defaultDistFileExtMap,
    quiet = false,
  } = option;
  const babelRes = babel.transformFileSync(filepath, babelConfig);
  let virtualDist: IVirtualDist | null = null;

  if (!isRes(babelRes)) {
    throw new Error(`${filepath} happen error`);
  }

  const distFilePath = getDistFilePath({
    filepath,
    rootDir,
    distDir,
    extMap: distFileExtMap,
  });

  if (enableVirtualDist) {
    virtualDist = {
      distPath: distFilePath,
      sourceMapPath: '',
      code: '',
      sourcemap: '',
    };
  }

  if (
    babelRes?.map &&
    babelConfig.sourceMaps &&
    babelConfig.sourceMaps !== 'inline'
  ) {
    if (virtualDist) {
      virtualDist = {
        ...virtualDist,
        ...resolveSourceMap({ babelRes, distFilePath, enableVirtualDist }),
      };
    } else {
      resolveSourceMap({ babelRes, distFilePath, enableVirtualDist });
    }
  }

  if (virtualDist) {
    virtualDist = {
      ...virtualDist,
      distPath: distFilePath,
      code: babelRes.code as string,
    };
  } else {
    fs.ensureDirSync(path.dirname(distFilePath));
    fs.writeFileSync(distFilePath, babelRes.code as string);
  }

  if (verbose && !quiet) {
    logger.info(`${filepath} => ${distFilePath}`);
  }

  return virtualDist;
};
