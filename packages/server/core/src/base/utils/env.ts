export const getRuntimeEnv = () => {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  if (globalThis?.process?.release?.name === 'node') {
    return 'node';
  }
  return 'other';
};

export const checkIsProd = () => {
  const env = getRuntimeEnv();

  switch (env) {
    case 'node':
      return process.env.NODE_ENV === 'production';

    default:
      return false;
  }
};
