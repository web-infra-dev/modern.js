import { afterEach, describe, expect, it, rstest as vi } from '@rstest/core';
import {
  createVmokManifestPlugin,
  normalizeVmokManifest,
} from './vmok-manifest-plugin.js';

afterEach(() => vi.unstubAllGlobals());

describe('Vmok manifest CSP compatibility', () => {
  it('resolves SCM region placeholders without mutating the manifest', () => {
    const manifest = {
      metaData: {
        publicPath: 'https://__CDN_PREFIX__/app/',
        region: { cn: 'cdn.example.com/obj' },
      },
    };
    expect(normalizeVmokManifest(manifest)).toMatchObject({
      metaData: { publicPath: 'https://cdn.example.com/obj/app/' },
    });
    expect(manifest.metaData.publicPath).toContain('__CDN_PREFIX__');
  });
  it("converts the existing template's getPublicPath without Function or eval", () => {
    vi.stubGlobal('Function', () => {
      throw new Error('CSP blocked');
    });
    vi.stubGlobal('eval', () => {
      throw new Error('CSP blocked');
    });
    const result = normalizeVmokManifest({
      metaData: { getPublicPath: 'return "https://cdn.example.com/app/"' },
    });
    expect(result).toEqual({
      metaData: { publicPath: 'https://cdn.example.com/app/' },
    });
  });
  it.each([
    'return fetch("https://evil.example")',
    'return "https://cdn.example/"; globalThis.compromised = true',
    'function () { return "https://cdn.example/"; }',
  ])('rejects executable public path: %s', getPublicPath => {
    expect(() =>
      normalizeVmokManifest({ metaData: { getPublicPath } }),
    ).toThrow('constant JSON string');
  });
  it('fails explicitly when the region cannot be resolved', () => {
    expect(() =>
      normalizeVmokManifest({
        metaData: { publicPath: 'https://__CDN_PREFIX__/app/' },
      }),
    ).toThrow('region.cn');
  });
  it('normalizes only the configured manifest fetch', async () => {
    const url = 'https://app.example/vmok-manifest.json';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          metaData: { getPublicPath: 'return "https://cdn.example/"' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const hook = createVmokManifestPlugin(url).fetch;
    if (!hook) {
      throw new Error('Missing fetch hook');
    }
    expect(
      await hook('https://other.example/manifest.json', {}),
    ).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    const result = await hook(url, {});
    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      throw new Error('Missing response');
    }
    expect(await result.json()).toEqual({
      metaData: { publicPath: 'https://cdn.example/' },
    });
  });
});
