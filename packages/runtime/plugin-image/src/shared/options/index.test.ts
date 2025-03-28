import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  ImageComponentContext,
  ImageContext,
  ImageOptions,
  ImageProps,
  ImageSerializableContext,
} from './';
import {
  createImageComponentContext,
  createImageContext,
  createImageOptions,
  createImageProps,
  createImageSerializableContext,
} from './';

describe('ImageContext', () => {
  it('should create a base instance', () => {
    const options = createImageContext();
    expectTypeOf(options).toMatchTypeOf<ImageContext>();
    expect(options).toMatchInlineSnapshot(`
      {
        "loader": undefined,
        "quality": 75,
      }
    `);
  });
});

describe('ImageOptions', () => {
  it('should create a base instance', () => {
    const options = createImageOptions();
    expectTypeOf(options).toMatchTypeOf<ImageContext>();
    expectTypeOf(options).toMatchTypeOf<ImageOptions>();
    expect(options).toMatchInlineSnapshot(`
      {
        "height": undefined,
        "loader": undefined,
        "quality": 75,
        "src": "",
        "unoptimized": false,
        "width": undefined,
      }
    `);
  });
});

describe('ImageComponentContext', () => {
  it('should create a base instance', () => {
    const options = createImageComponentContext();
    expectTypeOf(options).toMatchTypeOf<ImageContext>();
    expectTypeOf(options).toMatchTypeOf<ImageComponentContext>();
    expect(options).toMatchInlineSnapshot(`
      {
        "densities": [
          1,
          2,
        ],
        "fill": false,
        "loader": undefined,
        "loading": "lazy",
        "placeholder": false,
        "quality": 75,
      }
    `);
  });
});

describe('SerializableImageContext', () => {
  it('should create a base instance', () => {
    const options = createImageSerializableContext();
    expectTypeOf(options).toMatchTypeOf<ImageContext>();
    expectTypeOf(options).toMatchTypeOf<ImageSerializableContext>();
    expect(options).toMatchInlineSnapshot(`
      {
        "loader": undefined,
        "quality": 75,
      }
    `);
  });
});

describe('ImageProps', () => {
  it('should create a base instance', () => {
    const options = createImageProps();
    expectTypeOf(options).toMatchTypeOf<ImageContext>();
    expectTypeOf(options).toMatchTypeOf<ImageOptions>();
    expectTypeOf(options).toMatchTypeOf<ImageComponentContext>();
    expectTypeOf(options).toMatchTypeOf<ImageProps>();
    expect(options).toMatchInlineSnapshot(`
      {
        "alt": "",
        "densities": [
          1,
          2,
        ],
        "fill": false,
        "height": undefined,
        "loader": undefined,
        "loading": "lazy",
        "placeholder": false,
        "priority": false,
        "quality": 75,
        "src": "",
        "unoptimized": false,
        "width": undefined,
      }
    `);
  });
});
