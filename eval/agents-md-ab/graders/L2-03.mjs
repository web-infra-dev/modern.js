// L2-03 (file_ast + build): CSS Modules — a *.module.css(.scss/.less) file,
// imported in page.tsx and used via the style object; somewhere in the diffed
// sources a mention of output.cssModules (auto) or
// output.disableCssModuleExtension; build passes.
export default async function grade(ctx, c) {
  const moduleFiles = ctx.findFiles(rel =>
    /^src\/.*\.module\.(css|scss|less)$/.test(rel),
  );
  c.add(
    'module-css-file',
    moduleFiles.length > 0,
    'no *.module.css/.scss/.less under src/',
  );
  const page = ctx.read('src/routes/page.tsx') ?? '';
  const importM = page.match(
    /import\s+(\w+)\s+from\s+['"][^'"]*\.module\.(css|scss|less)['"]/,
  );
  c.add(
    'page-imports-module-css',
    !!importM,
    'page.tsx must import the .module.css file as an object',
  );
  const styleId = importM ? importM[1] : 'styles';
  c.add(
    'uses-style-object',
    importM &&
      new RegExp(`\\b${styleId}\\.[a-zA-Z_$][\\w$]*|\\b${styleId}\\[`).test(
        page,
      ),
    `page.tsx must use class names via ${styleId}.xxx`,
  );
  // config-option mention: comment in any project source or the config file
  const candidates = [
    page,
    ...moduleFiles.map(f => ctx.read(f) ?? ''),
    ...ctx
      .findFiles(rel => /^src\/.*\.(tsx?|css|scss|less)$/.test(rel))
      .map(f => ctx.read(f) ?? ''),
    ctx.read('modern.config.ts') ?? '',
  ].join('\n');
  c.add(
    'mentions-cssmodules-option',
    /cssModules|disableCssModuleExtension/.test(candidates),
    'expects a mention of output.cssModules (auto) or output.disableCssModuleExtension for non-.module files',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
