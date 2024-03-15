import path from 'path';

export const getGeneratorPath = (
  generator: string,
  distTag: string,
  paths?: string[],
) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(
      require.resolve(generator, { paths: paths ?? [process.cwd()] }),
    );
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};
