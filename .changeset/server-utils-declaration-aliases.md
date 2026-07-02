---
'@modern-js/server-utils': patch
---

fix(server-utils): resolve tsconfig path aliases in emitted declaration files

The tsconfig-paths transformer only ran on the JS emit, so path aliases (unresolvable outside the project) leaked into `.d.ts` output when `declaration` is enabled. The same rewrite now also runs on declaration emit, including inline `import("...")` types.
