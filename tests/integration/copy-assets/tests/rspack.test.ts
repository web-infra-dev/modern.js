import { testPublicHtml } from './testPublicHtml';

describe('copy assets', () => {
  test(`should copy public html and replace the assetPrefix variable in rspack`, async () => {
    await testPublicHtml('rspack');
  });
});
