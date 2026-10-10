import { expect, it } from '@rstest/core';
import { normalizeToolConfig } from '../src/definition';
import { bindUiResources } from '../src/ui-resources';
it('inherits defaults and replaces CSP lists explicitly without mutating input', () => {
  const defaults = {
    assetBase: 'https://cdn.example',
    exportName: 'default',
    csp: {
      resourceDomains: ['https://cdn.example'],
      connectDomains: ['https://api.example'],
    },
  };
  const tool = {
    name: 'card',
    view: { module: './Card', csp: { connectDomains: [] } },
  };
  const result = normalizeToolConfig(tool, defaults);
  expect(result.view?.assetBase).toBe('https://cdn.example');
  expect(result.view?.csp).toEqual({
    resourceDomains: ['https://cdn.example'],
    connectDomains: [],
  });
  expect(tool.view).toEqual({ module: './Card', csp: { connectDomains: [] } });
  expect(
    normalizeToolConfig({ name: 'headless' }, defaults).view,
  ).toBeUndefined();
});
it('prioritizes tool and application asset bases over runtime binding defaults', () => {
  const definition = {
    remotes: [],
    viewDefaults: { assetBase: 'https://app.example' },
    tools: [
      { name: 'one', view: { module: './One' } },
      {
        name: 'two',
        view: { module: './Two', assetBase: 'https://tool.example' },
      },
    ],
  };
  const bound = bindUiResources(definition, {
    directory: '/ui',
    assetBase: 'request',
  });
  expect(bound.tools.map(tool => tool.view?.assetBase)).toEqual([
    'https://app.example',
    'https://tool.example',
  ]);
});
