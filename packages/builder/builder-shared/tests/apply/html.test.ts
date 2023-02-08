import { describe, expect, it } from 'vitest';
import {
  getTemplatePath,
  SharedBuilderConfig,
  SharedNormalizedConfig,
} from '../../src';

describe('apply/html', () => {
  it.each<[string, string, SharedBuilderConfig['html']]>([
    ['main', 'foo', { template: 'foo' }],
    ['main', 'foo', { templateByEntries: { main: 'foo' } }],
    ['other', 'bar', { template: 'bar', templateByEntries: { main: 'foo' } }],
  ])(`should get template path for %s`, async (entry, expected, html) => {
    const templatePath = getTemplatePath(entry, {
      html,
    } as SharedNormalizedConfig);
    expect(templatePath).toEqual(expected);
  });
});
