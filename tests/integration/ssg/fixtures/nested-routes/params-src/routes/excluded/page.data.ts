export const ssgParams = () => [];
export const loader = () => {
  throw new Error('A static page with an empty parameter list must not render');
};
