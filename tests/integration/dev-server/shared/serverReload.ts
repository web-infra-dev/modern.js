// Edited by tests/serverReload.test.ts. Uses an enum on purpose: Node.js native
// type stripping can't run it, so it checks the TypeScript runtime as well.
export enum Version {
  Current = 'v1',
}
