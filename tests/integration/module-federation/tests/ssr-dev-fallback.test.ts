import { describe, it } from '@rstest/core';
import { runManifestFallbackScenario } from './ssr-update/manifest-fallback.mjs';

// Normal development interactions live in Weather Lab's remote-updates suite.
// These fixtures need a deliberately stale manifest gateway and a held POST.
describe('Development manifest admission and independent Service selection', () => {
  it('discovers ordinary SSR updates behind a fixed manifest URL', async () => {
    await runManifestFallbackScenario('ordinary');
  }, 600000);

  it('withholds failed builds and recovers Bridge source, CSS, loader and rapid edits', async () => {
    await runManifestFallbackScenario('bridge');
  }, 600000);

  for (const mode of ['service', 'service-csr']) {
    it(`${mode}: serves a held POST from the current deployment with matching hydration and no replay`, async () => {
      await runManifestFallbackScenario(mode);
    }, 600000);
  }
});
