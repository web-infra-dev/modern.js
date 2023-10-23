export const BUILTIN_LOADER = 'builtin:';

export const useLegacyTransform = () =>
  Boolean(process.env.INTERNAL_USE_RSPACK_TRANSFORM_LEGACY);
