// Minimal stand-in for the published `@modern-js/plugin-bff/server` types.
// Inside the monorepo that specifier resolves to workspace source whose
// transitive declarations (compiled vendors, etc.) do not pass a strict
// `skipLibCheck: false` program; consumers install the published package
// instead. The stub keeps the generated client declarations fully checked
// while cutting that graph off.
export type ApiRunner<Inputs, Response extends Promise<unknown>> = (
  ...args: any[]
) => Response;
