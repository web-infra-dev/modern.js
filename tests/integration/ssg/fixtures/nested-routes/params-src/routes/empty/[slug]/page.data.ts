export const ssgParams = () => [];
export const loader = () => {
  throw new Error('The loader for an empty parameter list must not run');
};
