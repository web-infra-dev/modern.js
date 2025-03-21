import { invariant } from '../../shared/utils';

const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];

export interface SizeDescriptor {
  condition: string | null;
  value: string;
}

export function parseSizes(sizes: string): SizeDescriptor[] {
  if (!sizes.trim()) return [];

  const sizeParts = sizes.split(',').map(part => part.trim());

  const descriptors: SizeDescriptor[] = sizeParts.map((part, index) => {
    const closingParenIndex = part.lastIndexOf(')');

    if (closingParenIndex === -1) {
      return { condition: null, value: part.trim() };
    }

    const condition = part.slice(0, closingParenIndex + 1).trim();
    const value = part.slice(closingParenIndex + 1).trim();

    return { condition, value };
  });

  return descriptors;
}

export function validateSizes(sizes: SizeDescriptor[]) {
  const last = sizes.at(-1);
  if (!last) {
    throw new Error('Sizes must have at least one size part');
  }
  for (const size of sizes) {
    if (!size.value) {
      throw new Error('Size part must have a value');
    }
    if (size === last) {
      if (size.condition) {
        throw new Error('Last size part cannot have a condition');
      }
    } else {
      if (!size.condition) {
        throw new Error(
          'All size parts except the last one must have a condition',
        );
      }
    }
  }
}

export function resolveResponsiveSizes(
  value: number | undefined,
  sizes: SizeDescriptor[],
): number[] {
  const allSizes = [...imageSizes, ...deviceSizes];

  if (value !== undefined && !sizes.some(size => size.value.endsWith('vw'))) {
    return allSizes;
  }

  const viewportWidthRe = /(-?[\d.]+)vw\s*$/g;
  const percentSizes: number[] = [];

  for (const size of sizes) {
    let match;
    while ((match = viewportWidthRe.exec(size.value)) !== null) {
      const percent = Number(match[1]);
      invariant(
        !Number.isNaN(percent),
        `Invalid size part: ${size.value} (must be a number)`,
      );
      invariant(
        percent >= 0 && percent <= 100,
        `Invalid size part: ${size.value} (must be between 0 and 100)`,
      );
      percentSizes.push(percent);
    }
  }

  if (percentSizes.length) {
    const smallestRatio = Math.min(...percentSizes) * 0.01;
    return allSizes.filter((s: number) => s >= deviceSizes[0] * smallestRatio);
  }

  return allSizes;
}
