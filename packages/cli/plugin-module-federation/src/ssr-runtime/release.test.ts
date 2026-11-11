import { afterEach, expect, it } from '@rstest/core';
import { clientRemote, releaseScript } from './release';
import releasePlugin from '../cli/mfRuntimePlugins/ssr-release';
import { createSSRUpdateAdapter } from '../server/ssrUpdate';

const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
afterEach(() => {
  if (descriptor) Object.defineProperty(globalThis, 'document', descriptor);
  else delete (globalThis as any).document;
});

it('copies only explicitly public fields and safely embeds script-like strings', () => {
  const value = clientRemote({
    name: 'remote',
    entry: 'https://cdn.test/v2/manifest.json?text=</script>',
    serverSecret: 'private',
  } as any);
  const script = releaseScript('host', 2, [value]);
  expect(script).not.toContain('private');
  expect(script.match(/<\/script>/g)).toHaveLength(1);
  expect(script).toContain('\\u003c/script\\u003e');
  expect(() =>
    clientRemote({
      name: 'remote',
      entry: 'https://user:password@cdn.test/a.js',
    }),
  ).toThrow('credentials');
  expect(() =>
    clientRemote({ name: 'remote', entry: 'javascript:alert(1)' }),
  ).toThrow();
});

it('pins a compiled alias before initialization without leaking server metadata', () => {
  (globalThis as any).document = {
    querySelectorAll() {
      return [
        {
          textContent: JSON.stringify({
            name: 'host',
            revision: 2,
            remotes: [
              { name: 'remote', entry: 'https://cdn.test/v2/manifest.json' },
            ],
          }),
        },
      ];
    },
  };
  const args = {
    userOptions: {
      name: 'host',
      remotes: [
        {
          name: 'provider',
          alias: 'remote',
          entry: 'https://cdn.test/v1/manifest.json',
        },
      ],
    },
  };
  (releasePlugin().beforeInit as any)(args);
  expect(args.userOptions.remotes).toEqual([
    {
      name: 'provider',
      alias: 'remote',
      entry: 'https://cdn.test/v2/manifest.json',
    },
  ]);
});

it('requires paired client metadata before mutation and preserves old template snapshots', async () => {
  const adapter = createSSRUpdateAdapter({
    name: 'host',
    entries: ['index'],
    hydration: {
      remotes: [{ name: 'remote', entry: 'https://cdn.test/v1/manifest.json' }],
    },
  });
  const resources = {
    templates: {
      index:
        '<html><head><script src="host.js"></script></head><body></body></html>',
    },
  };
  adapter.prepareResources(resources);
  const old = resources.templates.index;
  expect(old.indexOf('data-modern-mf-release')).toBeLessThan(
    old.indexOf('host.js'),
  );
  let mutations = 0;
  const application = {
    async update() {
      mutations++;
      return 1;
    },
  };
  await expect(
    adapter.update(application, 'remote', {
      entry: 'https://internal.test/v2.json',
    }),
  ).rejects.toThrow('public client');
  expect(mutations).toBe(0);
  adapter.prepareResources(resources);
  expect(resources.templates.index).toBe(old);
});
