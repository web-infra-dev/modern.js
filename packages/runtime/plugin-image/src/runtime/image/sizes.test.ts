import { describe, expect, it } from 'vitest';
import {
  type SizeDescriptor,
  parseSizes,
  resolveResponsiveSizes,
  validateSizes,
} from './sizes';

const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];
const allSizes = [...imageSizes, ...deviceSizes];

describe('parseSizes & validateSizes', () => {
  it('should handle empty strings', () => {
    expect(parseSizes('')).toEqual([]);
    expect(parseSizes('  ')).toEqual([]);

    expect(() => validateSizes([])).toThrow();
  });

  it('should handle single size value', () => {
    const expected: SizeDescriptor[] = [{ condition: null, value: '100vw' }];

    expect(parseSizes('100vw')).toEqual(expected);
    expect(() => validateSizes(expected)).not.toThrow();
  });

  it('should handle single size value with media condition', () => {
    const expected: SizeDescriptor[] = [
      { condition: '(max-width: 768px)', value: '100vw' },
    ];

    expect(parseSizes('(max-width: 768px) 100vw')).toEqual(expected);
    expect(() => validateSizes(expected)).toThrow();
  });

  it('should handle multiple size values', () => {
    const input = '(min-width: 1200px) 50vw, (min-width: 768px) 75vw, 100vw';
    const expected: SizeDescriptor[] = [
      { condition: '(min-width: 1200px)', value: '50vw' },
      { condition: '(min-width: 768px)', value: '75vw' },
      { condition: null, value: '100vw' },
    ];

    expect(parseSizes(input)).toEqual(expected);
    expect(() => validateSizes(expected)).not.toThrow();
  });

  it('should ignore the media condition of the last item', () => {
    const expected: SizeDescriptor[] = [
      { condition: null, value: '50vw' },
      { condition: '(max-width: 768px)', value: '100vw' },
    ];

    expect(parseSizes('50vw, (max-width: 768px) 100vw')).toEqual(expected);
    expect(() => validateSizes(expected)).toThrow();
  });

  it('should handle complex media query conditions', () => {
    const input =
      '(min-width: 1200px) and (orientation: landscape) 300px, 100vw';
    const expected: SizeDescriptor[] = [
      {
        condition: '(min-width: 1200px) and (orientation: landscape)',
        value: '300px',
      },
      {
        condition: null,
        value: '100vw',
      },
    ];
    expect(parseSizes(input)).toEqual(expected);
    expect(() => validateSizes(expected)).not.toThrow();
  });

  it('should handle input with spaces', () => {
    const input = '  (max-width: 768px)  100vw  ,  200px  ';
    const expected: SizeDescriptor[] = [
      { condition: '(max-width: 768px)', value: '100vw' },
      { condition: null, value: '200px' },
    ];

    expect(parseSizes(input)).toEqual(expected);
    expect(() => validateSizes(expected)).not.toThrow();
  });
});

interface ResolveResponsiveSizesCase {
  width?: number;
  sizes: string;
  expected: number[] | Error;
}

describe('resolveResponsiveSizes', () => {
  const cases: ResolveResponsiveSizesCase[] = [
    {
      sizes: '50vw',
      expected: [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    },
    {
      sizes: '100vw',
      expected: deviceSizes,
    },
    {
      sizes: '100vw, 50vw',
      expected: [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    },
    {
      sizes: '10vw',
      expected: [
        64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840,
      ],
    },
    {
      sizes: '100.vw',
      expected: deviceSizes,
    },
    {
      sizes: '.1vw',
      expected: allSizes,
    },
    {
      sizes: '(min-width: 1200px) 50vw, 100vw',
      expected: [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    },
    {
      width: 800,
      sizes: '100%',
      expected: allSizes,
    },
    {
      width: 800,
      sizes: '800px',
      expected: allSizes,
    },
    {
      sizes: '(max-width: 600px) 480px, 800px',
      expected: allSizes,
    },
    {
      sizes: '10vw, 110vw',
      expected: new Error(
        'Invalid size part: 110vw (must be between 0 and 100)',
      ),
    },
    {
      sizes: '-10vw',
      expected: new Error(
        'Invalid size part: -10vw (must be between 0 and 100)',
      ),
    },
  ];
  for (const { sizes, width, expected } of cases) {
    let description = `should handle with '${sizes}'`;
    width !== undefined && (description += ` by width ${width}px`);
    it(description, () => {
      const run = () => resolveResponsiveSizes(width, parseSizes(sizes));
      if (expected instanceof Error) {
        expect(run).toThrow(expected.message);
      } else {
        expect(run()).toEqual(expected);
      }
    });
  }
});
