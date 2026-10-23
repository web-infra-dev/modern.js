import {
  bindUiResources,
  createUiManifest,
  resolveUiHtml,
} from '../src/ui/resources';

describe('UI resources', () => {
  it('builds and binds legacy views without changing handlers or the definition', () => {
    const handler = () => ({ structuredContent: { ok: true } });
    const definition = {
      remotes: [],
      tools: [{ name: 'legacy', module: './View', handler }],
    };
    const manifest = createUiManifest(definition);
    expect(manifest.tools.legacy.resourceUri).toBe('ui://app/legacy');
    const bound = bindUiResources(definition, {
      directory: '/tmp/app/ui',
      manifest,
    });
    expect(bound.tools[0].view?.module).toBe('./View');
    expect(bound.tools[0].view?.html).toBe(
      `/tmp/app/ui/${manifest.tools.legacy.html.split('/').pop()}`,
    );
    expect(bound.tools[0].handler).toBe(handler);
    expect(definition.tools[0]).not.toHaveProperty('view');
  });

  it('treats assetBase as a directory and preserves explicit connection permissions', () => {
    const ui = { csp: { connectDomains: ['https://api.example.com'] } };
    const result = resolveUiHtml(
      '<html><head></head><body></body></html>',
      ui,
      'https://cdn.example.com/app',
    );
    expect(result.text).toContain('<base href="https://cdn.example.com/app/">');
    expect(result.ui.csp).toEqual({
      connectDomains: ['https://api.example.com'],
      resourceDomains: ['https://cdn.example.com'],
      baseUriDomains: ['https://cdn.example.com'],
    });
    expect(ui.csp).toEqual({ connectDomains: ['https://api.example.com'] });
  });

  it('rejects HTML without a head when a base must be injected', () => {
    expect(() =>
      resolveUiHtml('<p>Card</p>', {}, 'https://example.com/'),
    ).toThrow('requires a <head> element');
    expect(resolveUiHtml('<p>Card</p>', {}).text).toBe('<p>Card</p>');
  });
});
