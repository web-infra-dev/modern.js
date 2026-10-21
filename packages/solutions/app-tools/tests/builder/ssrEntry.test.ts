import { isStreamingSSR } from '../../src/builder/shared/builderPlugins/adapterSSR';
import type { AppNormalizedConfig, ServerUserConfig } from '../../src/types';

function config(server: ServerUserConfig): AppNormalizedConfig {
  return { server, source: { mainEntryName: 'index' } } as AppNormalizedConfig;
}

describe('streaming SSR entry selection', () => {
  it.each([true, {}, { mode: 'stream' }] as const)(
    'inherits streaming SSR from %j while honoring explicit entry overrides',
    ssr => {
      const value = config({
        ssr,
        ssrByEntries: { csr: false, string: { mode: 'string' } },
      });
      expect(isStreamingSSR(value)).toBe(true);
      expect(isStreamingSSR(value, 'stream')).toBe(true);
      expect(isStreamingSSR(value, 'csr')).toBe(false);
      expect(isStreamingSSR(value, 'string')).toBe(false);
    },
  );

  it('enables only the streaming entries when global SSR is disabled', () => {
    const value = config({
      ssr: false,
      ssrByEntries: {
        stream: true,
        defaultMode: {},
        string: { mode: 'string' },
      },
    });
    expect(isStreamingSSR(value)).toBe(true);
    expect(isStreamingSSR(value, 'stream')).toBe(true);
    expect(isStreamingSSR(value, 'defaultMode')).toBe(true);
    expect(isStreamingSSR(value, 'string')).toBe(false);
    expect(isStreamingSSR(value, 'csr')).toBe(false);
  });

  it('merges object overrides with the global string SSR mode', () => {
    const value = config({
      ssr: { mode: 'string' },
      ssrByEntries: { inherited: {}, stream: { mode: 'stream' } },
    });
    expect(isStreamingSSR(value, 'inherited')).toBe(false);
    expect(isStreamingSSR(value, 'stream')).toBe(true);
  });

  it('resolves the legacy package-name override only for the main entry', () => {
    const value = config({ ssr: true, ssrByEntries: { 'test-app': false } });
    expect(isStreamingSSR(value, 'index', { packageName: 'test-app' })).toBe(
      false,
    );
    expect(isStreamingSSR(value, 'other', { packageName: 'test-app' })).toBe(
      true,
    );
  });

  it('prefers the explicit main-entry override to the package-name alias', () => {
    const value = config({
      ssr: false,
      ssrByEntries: { index: { mode: 'string' }, 'test-app': true },
    });
    expect(isStreamingSSR(value, 'index', { packageName: 'test-app' })).toBe(
      false,
    );
  });
});
