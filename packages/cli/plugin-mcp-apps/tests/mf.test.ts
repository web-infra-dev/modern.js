import { expect, it } from '@rstest/core';
import { bindMfRemotes, mfArtifact } from '../src/mf';

const definition = {
  remotes: [],
  tools: [{ name: 'greet', remote: 'mcp_ui', view: { module: './Greeting' } }],
};
const artifact = {
  name: 'mcp_ui',
  manifest: 'static/mf-manifest.json',
  publicPath: 'auto',
};

it('uses the emitted manifest publicPath including CDN path prefixes', () => {
  const emitted = mfArtifact(
    'custom/ui.json',
    JSON.stringify({
      name: 'mcp_ui',
      exposes: [],
      metaData: {
        remoteEntry: { name: 'remote.js' },
        publicPath: 'https://cdn.example/app/v1/',
      },
    }),
  );
  expect(emitted).toEqual({
    ...artifact,
    manifest: 'custom/ui.json',
    publicPath: 'https://cdn.example/app/v1/',
  });
  const bound = bindMfRemotes(
    definition,
    [emitted!],
    new Request('http://localhost:8080/mcp'),
  );
  expect(bound.remotes[0]).toEqual({
    name: 'mcp_ui',
    baseUrl: 'https://cdn.example/app/v1/custom/ui.json',
    csp: {
      resourceDomains: ['https://cdn.example'],
      connectDomains: ['https://cdn.example'],
    },
  });
  expect(definition.remotes).toEqual([]);
});

it('resolves auto publicPath per request and respects HTTPS termination', () => {
  for (const host of ['localhost:9123', 'preview.example']) {
    const bound = bindMfRemotes(
      definition,
      [artifact],
      new Request(`http://${host}/mcp`, {
        headers: { 'x-forwarded-proto': 'https' },
      }),
    );
    expect(bound.remotes[0].baseUrl).toBe(
      `https://${host}/static/mf-manifest.json`,
    );
    expect(bound.remotes[0].csp?.resourceDomains).toEqual([`https://${host}`]);
  }
});

it('preserves explicit external remotes and rejects missing local manifests', () => {
  const remote = {
    name: 'mcp_ui',
    baseUrl: 'https://other.example/manifest.json',
  };
  expect(
    bindMfRemotes(
      { ...definition, remotes: [remote] },
      [],
      new Request('https://app.example/mcp'),
    ).remotes,
  ).toEqual([remote]);
  expect(() =>
    bindMfRemotes(definition, [], new Request('https://app.example/mcp')),
  ).toThrow('Missing MF manifest');
  expect(mfArtifact('stats.json', '{"name":"mcp_ui"}')).toBeUndefined();
});
