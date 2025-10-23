# RSC + Module Federation Integration Status

**Last Updated**: 2025-10-22

## Executive Summary

✅ **CSR Remote Build**: PASSING
✅ **SSR Remote Build**: PASSING
❌ **CSR Host Build**: Builds but client manifest empty
❌ **CSR Host Tests**: Failing (server won't start)
❓ **SSR Host Tests**: Not yet run

## Recent Fixes

### User Commits (ScriptedAlchemy)

1. **d59d01a16**: Treat app entries as react-server layer roots
   - Fixed empty client manifest in hosts by marking entries as react-server layer
   - Added rsc-entry-server rule to rsbuild-rsc-plugin.ts

2. **26a789835**: AST-based export derivation + increased retries
   - Client loader now derives export names from AST when metadata missing
   - Increased manifest hydration retries to reduce race conditions
   - Fixed CSR remote builds

### Assistant Attempts (Not Committed)

- Added `isServer` check to only apply entry-server rule to node compiler
- Added `include` filters to restrict rsc-server processing to /src/ directory
- Attempted to exclude runtime/toolkit code from server layer processing
- These changes fixed React import errors but didn't solve the full integration

## Build Test Results

### ✅ CSR Remote (rsc-csr-mf): PASS
```bash
pnpm --filter rsc-csr-mf build
```
- ✅ Node compiler: Built in 1.29s
- ✅ Web compiler: Built in 10.5s
- ✅ Server references manifest: Generated correctly with moduleId 545
- ✅ Total size: 461.5 KB (web), 500.9 KB (node)

**Key Success Factors**:
- AST-based export derivation in rsc-client-loader
- Increased retry count for manifest hydration
- Server plugin correctly detects and registers action.ts

### ✅ SSR Remote (rsc-ssr-mf): PASS
```bash
pnpm --filter rsc-ssr-mf build
```
- ✅ Node compiler: Built successfully
- ✅ Web compiler: Built successfully
- ✅ Both client and server components compile correctly

### ⚠️  CSR Host (rsc-csr-mf-host): BUILD OK, MANIFEST EMPTY
```bash
pnpm --filter rsc-csr-mf-host build
```
- ✅ Node compiler: Built in 5.15s
- ✅ Web compiler: Built in 5.95s
- ❌ **react-client-manifest.json**: Empty `{}`
- ❌ **server-references-manifest.json**: 0 entries

**Issue**: ClientRoot.tsx (which has 'use client') is not being detected and registered in the client manifest.

**Root Cause**: The rsc-entry-server rule marks the entry as react-server layer, but the server plugin's client component discovery isn't working for the host's specific entry/import structure.

### ❌ CSR Host Integration Tests: FAIL (8/8 failed)
```bash
pnpm exec jest --testPathPattern=rsc-csr-mf-host
```
**Error**: "Server at http://localhost:XXXXX/ did not become ready within 30000ms"

**Likely Cause**: Empty client manifest prevents server from starting properly. The server probably crashes or hangs when trying to resolve client components that aren't in the manifest.

## Technical Analysis

### What's Working

1. **Server Module Detection in Remotes** ✅
   - RSC server plugin correctly identifies 'use server' modules
   - Assigns moduleIds via chunkGraph
   - Writes server-references-manifest.json
   - AST-based fallback ensures moduleId discovery even with timing issues

2. **Manifest Hydration** ✅
   - Done hook hydrates moduleIds from chunkGraph
   - Reads back manifest file with 100ms delay
   - Client loader retries 5x with 50ms delay
   - Falls back to manifest file if sharedData unavailable

3. **Remote Builds** ✅
   - Both CSR and SSR remotes build successfully
   - MF exposures work correctly
   - Server actions (action.ts) properly registered

### What's Not Working

1. **Client Component Detection in Hosts** ❌
   - ClientRoot.tsx not detected despite having 'use client'
   - react-client-manifest.json remains empty
   - Server plugin doesn't log any "client module detected" messages

2. **Host Server Startup** ❌
   - Servers timeout during startup (30s)
   - Likely crashes due to missing client manifest entries
   - Cannot resolve ClientRoot.tsx references

### Why Client Components Aren't Detected in Hosts

The entry-server rule marks application entries as react-server layer:

```typescript
if (isServer && entryPath2Name.size > 0) {
  const entryPaths = Array.from(entryPath2Name.keys());
  chain.module
    .rule('rsc-entry-server')
    .resource(entryPaths)
    .layer(webpackRscLayerName)
    .end();
}
```

**Expected Flow**:
1. Entry (src/App.tsx) marked as react-server layer
2. App.tsx imports ClientRoot.tsx
3. rsc-server-loader processes ClientRoot.tsx
4. Detects 'use client' directive
5. Registers in clientReferencesMap
6. Client plugin writes to react-client-manifest.json

**Actual Flow**:
1. Entry marked as react-server layer ✅
2. App.tsx imports ClientRoot.tsx ✅
3. rsc-server-loader ???
4. ClientRoot.tsx NOT detected ❌
5. clientReferencesMap empty ❌
6. react-client-manifest.json empty ❌

**Possible Issues**:
- Entry paths in Modern.js might be generated files (.modern-js/main/index.server.jsx), not user files (src/App.tsx)
- The issuerLayer chain might not propagate correctly to ClientRoot.tsx
- Include/exclude filters might be preventing discovery
- Modern.js entry wrapping might break the layer chain

## Commits Made

1. **6bed533**: Initial RSC+MF integration (77 files)
2. **9f8ad313a**: Fixed TypeScript type errors and plugin registration
3. **eb10b34aa**: Fixed SWC parser error
4. **f4cb50393**: Fixed HtmlWebpackPlugin child compiler crashes
5. **68902ccfc**: Integration improvements (auto-generated)
6. **69a14df88**: Added manifest hydration for server module IDs
7. **d936d674c**: Added integration status documentation
8. **d59d01a16**: (User) Treat app entries as react-server layer roots
9. **26a789835**: (User) AST-based export derivation + increased retries

## Next Steps to Complete Integration

### Immediate Priority: Fix Host Client Manifest

**Option 1: Debug Entry Discovery**
- Add extensive logging to understand what entries are being marked
- Check if the entry paths include user application files
- Verify the layer propagation chain from entry → ClientRoot.tsx

**Option 2: Alternative Discovery Mechanism**
- Instead of relying on entry marking, scan for 'use client' files during build
- Explicitly register known client components
- Use a different hook/phase for client component discovery

**Option 3: Make System Tolerant**
- Allow empty client manifest (log warning instead of crash)
- Implement runtime fallback for missing client component registrations
- Use the user's suggested approach: stub createServerReference with pseudo IDs

### Testing Plan

1. Fix client manifest detection
2. Rebuild CSR host
3. Verify react-client-manifest.json is populated
4. Run CSR host integration tests
5. Run SSR host integration tests
6. Clean up debug logs
7. Final commit and documentation

## Debug Commands

Enable debug logging:
```bash
DEBUG_RSC_PLUGIN=1 pnpm build
```

Check manifests:
```bash
# CSR remote (working)
cat tests/integration/rsc-csr-mf/dist/bundles/server-references-manifest.json
cat tests/integration/rsc-csr-mf/dist/react-client-manifest.json

# CSR host (broken)
cat tests/integration/rsc-csr-mf-host/dist/bundles/server-references-manifest.json
cat tests/integration/rsc-csr-mf-host/dist/react-client-manifest.json  # Empty!
```

Run tests:
```bash
cd tests
pnpm exec jest --testPathPattern=rsc-csr-mf-host --runInBand --no-coverage --forceExit
pnpm exec jest --testPathPattern=rsc-ssr-mf-host --runInBand --no-coverage --forceExit
```

## Key Files

- `packages/cli/uni-builder/src/shared/rsc/plugins/rsbuild-rsc-plugin.ts` - Entry layer marking
- `packages/cli/uni-builder/src/shared/rsc/plugins/rsc-server-plugin.ts` - Server component detection
- `packages/cli/uni-builder/src/shared/rsc/rsc-client-loader.ts` - Client-side transformation
- `tests/integration/rsc-csr-mf-host/src/ClientRoot.tsx` - Client component not being detected
- `tests/integration/rsc-csr-mf-host/src/App.tsx` - Server component entry

## Conclusion

Significant progress has been made:
- ✅ Fixed server module ID race condition
- ✅ Fixed HtmlWebpackPlugin crashes
- ✅ Remote builds working perfectly
- ❌ Host client manifest still empty - blocking integration tests

The remaining issue is the final piece: getting the server plugin to detect and register client components in host applications. Once this is resolved, the full RSC + Module Federation integration will be complete.
