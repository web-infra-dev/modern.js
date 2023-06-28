import { testPublicHtml } from './testPublicHtml';

describe('copy assets', () => {
  test(`should copy public html and replace the assetPrefix variable in webpack`, async () => {
    await testPublicHtml('webpack');
  });
});
