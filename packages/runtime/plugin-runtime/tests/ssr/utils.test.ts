import { attributesToString } from '../../src/ssr/serverRender/utils';

describe('ssr utils', () => {
  it('should attributesToString return string correctly', async () => {
    const str = attributesToString({ nonce: 'test-nonce' });
    expect(str).toMatch(' nonce="test-nonce"');

    const str1 = attributesToString({ crossorigin: true, nonce: undefined });
    expect(str1).toMatch(' crossorigin="true"');
  });
});
