export const get = (...args: unknown[]) => ({
  segments: args.slice(0, -1),
  input: args[args.length - 1],
});
