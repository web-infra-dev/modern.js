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
