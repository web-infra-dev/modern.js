export const isRelativePath = (test: string): boolean =>
  /^\.\.?($|[\\/])/.test(test);
