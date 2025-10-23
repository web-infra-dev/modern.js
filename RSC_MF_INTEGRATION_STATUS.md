# RSC + Module Federation Integration Status

## Completed Tasks

### 1. Fixed Server Module ID Race Condition ✓
**Problem**: The web compiler's rsc-client-loader couldn't find moduleIds that the Node compiler assigns, causing CSR remote builds to fail.

**Solution**: Enhanced RSC server plugins (both webpack and rspack) to ensure server module IDs are populated in sharedData before the client build accesses them.

**Changes**:
- `packages/cli/uni-builder/src/shared/rsc/plugins/rsc-server-plugin.ts`: Changed done hook to tapPromise for async hydration from chunkGraph and manifest file readback
- `packages/cli/uni-builder/src/shared/rsc/plugins/rspack-rsc-server-plugin.ts`: Added same hydration logic
- `packages/cli/uni-builder/src/shared/rsc/rsc-client-loader.ts`: Enhanced fallback manifest reading with comprehensive debug logging

**Result**: CSR and SSR remotes now build successfully with proper module ID assignment.

### 2. Fixed HtmlWebpackPlugin Child Compiler Crashes ✓
**Problem**: Child compilers (e.g., HtmlWebpackPlugin) don't have `normalModuleFactory` parameter, causing crashes.

**Solution**: Added guards at the start of both compilation hooks in rsc-client-plugin.ts.

**Changes**:
- `packages/cli/uni-builder/src/shared/rsc/plugins/rsc-client-plugin.ts`: Added normalModuleFactory guards and safe defaults for sharedData access

### 3. Fixed TypeScript Type Errors ✓
**Problem**: Missing `remotes` property in `PluginOptions` interface.

**Solution**: Added `remotes` property to interface.

**Changes**:
- `packages/modernjs-mf-custom/src/types/index.ts`: Added remotes property

### 4. Fixed SWC Parser Errors ✓
**Problem**: SWC parser couldn't handle multi-line `as typeof import('webpack')` syntax.

**Solution**: Moved type assertion to single line with biome-ignore directive.

**Changes**:
- `packages/modernjs-mf-custom/src/cli/configPlugin.ts`: Fixed multi-line type import

### 5. Fixed Server Plugin Registration ✓
**Problem**: Incorrect plugin registration pattern using path-based instead of name-based resolution.

**Solution**: Changed to name-based plugin loading.

**Changes**:
- `packages/modernjs-mf-custom/src/cli/index.ts`: Fixed plugin registration
- `packages/modernjs-mf-custom/src/server/index.ts`: Fixed server plugin registration

## Test Results

### CSR Remote Build: ✓ PASS
```bash
pnpm --filter rsc-csr-mf build
```
- ✓ Node compiler assigns moduleId correctly (545)
- ✓ Web compiler hydrates moduleId from manifest
- ✓ Build completes successfully
- ✓ Server references manifest generated correctly

### SSR Remote Build: ✓ PASS
```bash
pnpm --filter rsc-ssr-mf build
```
- ✓ Build completes successfully
- ✓ Both client and server components compile correctly

### CSR Host Integration Tests: ✗ FAIL (8/8 tests failed)

**Primary Issue**: Empty client manifest prevents RSC from resolving client components.

**Error**:
```
Error: Could not find the module "src/ClientRoot.tsx#default#default" in the React Client Manifest.
```

**Root Cause**: The `react-client-manifest.json` in the host build is empty `{}`, which means the RSC client plugin isn't detecting and registering 'use client' components.

**Impact**:
- Dev mode: Host server crashes with connection refused
- Build mode: Tests timeout waiting for remote components to render

## Remaining Issues

### 1. Empty Client Manifest in Host Apps (CRITICAL)
**File**: `tests/integration/rsc-csr-mf-host/dist/react-client-manifest.json`
**Status**: Empty object `{}`
**Expected**: Should contain entries for ClientRoot.tsx and any other 'use client' components

**Investigation Needed**:
1. Why isn't the RSC client plugin detecting 'use client' directives in host apps?
2. Is there a difference in how the plugin runs for host vs remote?
3. Are there entry configuration issues affecting client component discovery?

**Files to Investigate**:
- `packages/cli/uni-builder/src/shared/rsc/plugins/rsc-client-plugin.ts` - Client component detection logic
- `tests/integration/rsc-csr-mf-host/modern.config.ts` - Host configuration
- Build output logs for client manifest generation

### 2. SSR Host Integration Tests (NOT RUN)
**Reason**: Blocked by client manifest issue
**Command**: `pnpm exec jest --testPathPattern=rsc-ssr-mf-host --runInBand`

## Commits Made

1. **6bed533**: Initial RSC+MF integration (77 files changed)
2. **9f8ad313a**: Fixed TypeScript type errors and plugin registration
3. **eb10b34aa**: Fixed SWC parser error
4. **f4cb50393**: Fixed HtmlWebpackPlugin child compiler crashes
5. **69a14df88**: Added manifest hydration for server module IDs

## Next Steps

### Immediate (Fix Client Manifest)
1. Debug why rsc-client-plugin isn't registering client components in host apps
2. Compare remote vs host build logs to identify differences
3. Verify plugin execution order and hooks
4. Check if entry configuration affects client component discovery

### After Client Manifest Fix
1. Re-run CSR host integration tests
2. Run SSR host integration tests
3. Clean up debug logging if tests pass
4. Final commit and documentation

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
cat tests/integration/rsc-csr-mf-host/dist/server-references-manifest.json
cat tests/integration/rsc-csr-mf-host/dist/react-client-manifest.json
```

Run individual tests:
```bash
cd tests
pnpm exec jest --testPathPattern=rsc-csr-mf-host --runInBand --no-coverage --forceExit
pnpm exec jest --testPathPattern=rsc-ssr-mf-host --runInBand --no-coverage --forceExit
```
