// Loaded by server/modern.server.ts through dynamic import(). The swc require
// hook compiles server files to CommonJS, where import() becomes require(),
// so these check that it still loads what require() can't.
export const loadEsmOnly = async () => {
  const [esmOnly, esmTla, local] = await Promise.all([
    // `exports` only has an `import` condition.
    import('dev-server-esm-only'),
    // Top-level await.
    import('dev-server-esm-tla'),
    // tsconfig alias, no extension, and an enum: these must stay on the
    // require hook.
    import('@shared/serverReload'),
  ]);
  return [esmOnly.value, esmTla.value, local.Version.Current].join(',');
};
