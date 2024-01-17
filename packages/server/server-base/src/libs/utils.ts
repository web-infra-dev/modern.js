export const getRuntimeEnv = () => {
  if (global?.process?.release?.name === 'node') {
    return 'node';
  }
  return 'other';
};
