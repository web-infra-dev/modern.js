import {
  PPR_NONCE_PLACEHOLDER,
  createPPRState,
  createPrerenderRequestProxy,
  findPPRArtifact,
  normalizePPRPathname,
  parseVariantHeader,
  replaceNoncePlaceholder,
} from '../../src/core/server/ppr/state';

const artifact = (pathname: string, variant: Record<string, string> = {}) => ({
  pathname,
  variant,
  head: '',
  prelude: '',
  postponed: null,
});

describe('partial prerendering state', () => {
  test('vary records the resolved value and every value', () => {
    const state = createPPRState('resume');
    expect(state.vary('lng', 'en', ['zh', 'en'])).toBe('en');
    expect(state.variant).toEqual({ lng: 'en' });
    expect(state.dimensions).toEqual({ lng: ['zh', 'en'] });
  });

  test('vary returns the prerendered value while prerendering', () => {
    const state = createPPRState('prerender', { lng: 'zh' });
    expect(state.vary('lng', 'en', ['zh', 'en'])).toBe('zh');
    expect(state.vary('theme', 'dark', ['light'])).toBe('dark');
    expect(state.variant).toEqual({ lng: 'zh', theme: 'dark' });
    // A resolved value outside the declared values is still prerendered.
    expect(state.dimensions.theme).toEqual(['light', 'dark']);
  });

  test('a request is only served the prelude of its variant', () => {
    const artifacts = [artifact('/a', { lng: 'zh' }), artifact('/a', { lng: 'en' })];
    expect(findPPRArtifact(artifacts, '/a', { lng: 'en' })).toBe(artifacts[1]);
    expect(findPPRArtifact(artifacts, '/a/', { lng: 'zh' })).toBe(artifacts[0]);
    expect(findPPRArtifact(artifacts, '/a', {})).toBeUndefined();
    expect(
      findPPRArtifact(artifacts, '/a', { lng: 'zh', theme: 'dark' }),
    ).toBeUndefined();
    expect(findPPRArtifact(artifacts, '/b', { lng: 'zh' })).toBeUndefined();
    expect(findPPRArtifact(undefined, '/a', {})).toBeUndefined();
  });

  test('normalizes trailing slashes', () => {
    expect(normalizePPRPathname('/')).toBe('/');
    expect(normalizePPRPathname('/a/')).toBe('/a');
    expect(normalizePPRPathname('/a//')).toBe('/a');
  });

  test('parses the variant header', () => {
    expect(parseVariantHeader(null)).toEqual({});
    expect(parseVariantHeader('{"lng":"zh"}')).toEqual({ lng: 'zh' });
    expect(() => parseVariantHeader('[1]')).toThrow();
  });

  test('replaces every nonce placeholder', () => {
    const html = `<script nonce="${PPR_NONCE_PLACEHOLDER}"></script><script nonce="${PPR_NONCE_PLACEHOLDER}"></script>`;
    expect(replaceNoncePlaceholder(html, 'abc')).toBe(
      '<script nonce="abc"></script><script nonce="abc"></script>',
    );
    expect(replaceNoncePlaceholder(html)).not.toContain(PPR_NONCE_PLACEHOLDER);
  });

  test('reading request data while prerendering suspends', () => {
    const request = createPrerenderRequestProxy({
      pathname: '/a',
      params: {},
      cookie: 'token=1',
      headers: {},
    });
    expect(request.pathname).toBe('/a');
    expect(request.params).toEqual({});
    let thrown: unknown;
    try {
      void request.cookie;
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Promise);
    expect(() => request.headers).toThrow();
  });
});
