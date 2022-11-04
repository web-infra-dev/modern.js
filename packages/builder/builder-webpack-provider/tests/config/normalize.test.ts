import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../src/config/normalize';

describe('normalizeConfig', () => {
  it('should normalize config correctly', () => {
    const normalized = normalizeConfig({
      source: { preEntry: 'foo' },
      dev: { https: true },
    });
    expect(normalized.source.preEntry).toEqual(['foo']);
    expect(normalized.dev.https).toEqual(true);
    expect(normalized.output.distPath).toBeDefined();
  });
});
