export const clamp = (x: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, x));
};
