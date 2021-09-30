export const errorLog = (...rest: string[]) => {
  throw new Error(rest.join('\n'));
};
