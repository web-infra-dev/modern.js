import { describe, it } from '@rstest/core';
import { runSubscriptionScenario } from './ssr-update/dev-subscriptions.mjs';

describe('Development request discovery and nested graph', () => {
  it('recovers when the producer starts after the host without recompiling the host', async () => {
    await runSubscriptionScenario('ordinary');
  }, 600000);

  it('discovers nested producer changes without rebuilding either consumer', async () => {
    await runSubscriptionScenario('nested');
  }, 600000);

  it('discovers rebuilt static producer artifacts from manifest checks', async () => {
    await runSubscriptionScenario('build-serve');
  }, 600000);

  for (const mode of ['bridge', 'service', 'service-csr']) {
    it(`${mode}: prepares updated SSR without browser reload and serves the selected release on manual refresh`, async () => {
      await runSubscriptionScenario(mode);
    }, 600000);
  }
});
