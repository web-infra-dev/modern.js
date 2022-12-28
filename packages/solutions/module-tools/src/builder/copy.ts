import path from 'path';
import type { CopyPattern } from '../types/copy';
import type { BaseBuildConfig } from '../types/config';

// TODO: about copy rules and debug
export const runPatterns = async (
  pattern: CopyPattern,
  options: {
    appDirectory: string;
    enableCopySync?: boolean;
    outDir: string;
    defaultContext: string;
  },
) => {
  const { fs, fastGlob, globby } = await import('@modern-js/utils');
  const { default: normalizePath } = await import(
    '../../compiled/normalize-path'
  );
  const { appDirectory, enableCopySync = false } = options;
  const { from, globOptions = {} } = pattern;
  const normalizedFrom = path.normalize(from);
  const defaultAbsContext = options.defaultContext;

  // when context is relative path
  if (typeof pattern.context === 'string') {
    pattern.context = path.isAbsolute(pattern.context)
      ? pattern.context
      : path.join(appDirectory, pattern.context);
  } else {
    pattern.context = defaultAbsContext;
  }

  let absoluteFrom;
  if (path.isAbsolute(normalizedFrom)) {
    absoluteFrom = normalizedFrom;
  } else {
    absoluteFrom = path.resolve(pattern.context, normalizedFrom);
  }

  let stats;
  try {
    stats = await fs.stat(absoluteFrom);
  } catch (error) {
    // Do Nothing
  }

  let fromType: 'file' | 'dir' | 'glob';
  if (stats) {
    if (stats.isDirectory()) {
      fromType = 'dir';
    } else if (stats.isFile()) {
      fromType = 'file';
    } else {
      fromType = 'glob';
    }
  } else {
    fromType = 'glob';
  }

  let glob;

  switch (fromType) {
    case 'dir':
      pattern.context = absoluteFrom;
      glob = path.posix.join(
        fastGlob.escapePath(normalizePath(path.resolve(absoluteFrom))),
        '**/*',
      );
      absoluteFrom = path.join(absoluteFrom, '**/*');

      if (typeof globOptions.dot === 'undefined') {
        globOptions.dot = true;
      }
      break;
    case 'file':
      pattern.context = path.dirname(absoluteFrom);
      glob = fastGlob.escapePath(normalizePath(path.resolve(absoluteFrom)));

      if (typeof globOptions.dot === 'undefined') {
        globOptions.dot = true;
      }
      break;
    case 'glob':
    default: {
      glob = path.isAbsolute(from)
        ? from
        : path.posix.join(
            fastGlob.escapePath(
              normalizePath(path.resolve(pattern.context ?? appDirectory)),
            ),
            from,
          );
    }
  }

  const globEntries = await globby(glob, {
    ...{ followSymbolicLinks: true },
    ...(pattern.globOptions || {}),
    cwd: pattern.context,
    objectMode: true,
  });
  const { default: pMap } = await import('../../compiled/p-map');
  pMap(globEntries, async globEntry => {
    if (!globEntry.dirent.isFile()) {
      return;
    }

    const from = globEntry.path;
    const absoluteFrom = path.resolve(pattern.context!, from);
    const to = path.normalize(
      typeof pattern.to !== 'undefined' ? pattern.to : '',
    );
    const toType =
      path.extname(to) === '' || to.slice(-1) === path.sep ? 'dir' : 'file';

    const relativeFrom = path.relative(
      pattern.context ?? defaultAbsContext,
      absoluteFrom,
    );

    const filename = toType === 'dir' ? path.join(to, relativeFrom) : to;

    const absoluteTo = path.isAbsolute(filename)
      ? filename
      : path.join(options.outDir, filename);
    if (enableCopySync) {
      fs.copySync(absoluteFrom, absoluteTo);
    } else {
      await fs.copy(absoluteFrom, absoluteTo);
    }
  });
};

export const copyTask = async (
  buildConfig: BaseBuildConfig,
  options: {
    appDirectory: string;
  },
) => {
  const copyConfig = buildConfig.copy;

  if (!copyConfig.patterns || copyConfig.patterns.length === 0) {
    return;
  }

  const { default: pMap } = await import('../../compiled/p-map');
  const concurrency = copyConfig?.options?.concurrency || 100;
  try {
    await pMap(
      copyConfig.patterns,
      async copyOption => {
        await runPatterns(copyOption, {
          ...options,
          enableCopySync: copyConfig.options?.enableCopySync,
          outDir: buildConfig.outDir,
          defaultContext: buildConfig.sourceDir,
        });
      },
      { concurrency },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error(`copy error: ${e.message}`);
    }
  }
};
