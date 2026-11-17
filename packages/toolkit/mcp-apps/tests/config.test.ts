import { it, expect } from '@rstest/core';
import { defineMcpViews } from '../src/cli/config';
import { createUiManifest } from '../src/cli/build';

it('normalizes colocated options without changing the existing resource contract', () => {
  const source = { routes: './src/routes', home: '/releases' };
  const resourceMeta = { 'doubao/ui': { preferredDisplayMode: 'inline' } };
  const config = defineMcpViews({
    views: {
      todos: './src/Todos.tsx',
      workspace: source,
      card: { source, resourceMeta, bootstrap: 'connected' },
    },
  });
  expect(config.views.card).toBe(source);
  expect(config.views.workspace).toBe(source);
  expect(config.viewOptions?.card).toEqual({
    resourceMeta,
    bootstrap: 'connected',
  });
  const manifest = createUiManifest(config, undefined);
  expect(manifest.views.card.resourceMeta).toEqual(resourceMeta);
  expect(manifest.views.card.bootstrap).toBe('connected');
  expect(Object.keys(source)).toEqual(['routes', 'home']);
});
it('retains validation for typed definitions supplied by JavaScript', () => {
  expect(() =>
    defineMcpViews({ views: { invalid: { source: '' } } }),
  ).toThrow();
});
