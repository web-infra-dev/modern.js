import { describe, it } from '@rstest/core';
import { runSubscriptionScenario } from './ssr-update/dev-subscriptions.mjs';

describe('Development subscription graph and fallback', () => {
  it('recovers when the producer starts after the host without recompiling the host', async () => {
    await runSubscriptionScenario('ordinary');
  }, 600000);

  it('propagates nested producer changes without rebuilding either consumer', async () => {
    await runSubscriptionScenario('nested');
  }, 600000);

  it('discovers rebuilt static producer artifacts without a producer subscription', async () => {
    await runSubscriptionScenario('build-serve');
  }, 600000);

  for (const mode of ['bridge', 'service', 'service-csr']) {
    it(`${mode}: applies loader and component changes and remounts the selected release`, async () => {
      await runSubscriptionScenario(mode);
    }, 600000);
  }
});
