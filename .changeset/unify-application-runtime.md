---
'@modern-js/runtime': minor
'@modern-js/plugin-module-federation': patch
---

Use one application definition, instance context and plugin lifecycle for ordinary pages and exported applications. Keep browser mounts and server requests isolated, preserve progressive Bridge hydration, and release instance resources after cancellation or unmount. Generate one shared runtime factory and remove the duplicate scoped registration and global Router initialization paths.

Remove the internal eager runtime registration and global runtime context accessors. The generated registry now registers a static runtime factory, and each mount or request creates its own runtime. Regenerate Modern's generated entry files and rebuild applications when upgrading. The public createRoot, render and runtime plugin APIs remain unchanged.
