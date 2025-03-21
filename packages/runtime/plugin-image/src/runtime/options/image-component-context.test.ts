import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ImageComponentContext } from '../../shared/options';
import { resolveImageComponentContext } from './image-component-context';

describe('resolveImageComponentContext', () => {
  it('should return the resolved image component context with default values', () => {
    const context = resolveImageComponentContext({});
    expectTypeOf(context).toMatchTypeOf<ImageComponentContext>();
    expect(context).toMatchObject({
      fill: false,
      loading: 'lazy',
      densities: [1, 2],
      priority: false,
      placeholder: false,
    });
  });

  it('should override default values with provided options', () => {
    const context = resolveImageComponentContext({
      fill: true,
      loading: 'eager',
      densities: [1, 2, 3],
      priority: true,
      placeholder: 'blur',
    });
    expect(context).toMatchObject({
      fill: true,
      loading: 'eager',
      densities: [1, 2, 3],
      priority: true,
      placeholder: 'blur',
    });
  });

  it('should allow partial override of options', () => {
    const context = resolveImageComponentContext({
      fill: true,
      priority: true,
    });
    expect(context).toMatchObject({
      fill: true,
      loading: 'lazy',
      densities: [1, 2],
      priority: true,
      placeholder: false,
    });
  });

  it('should preserve additional properties from createImageComponentContext', () => {
    const context = resolveImageComponentContext({});
    expect(context).toHaveProperty('densities');
    expect(context).toHaveProperty('fill');
    expect(context).toHaveProperty('placeholder');
    expect(context).toHaveProperty('priority');
    expect(context).toHaveProperty('loading');
  });
});
