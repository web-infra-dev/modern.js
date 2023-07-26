export interface A {
  a: number;
}

export const getA = (item: A) => {
  item.a = '0';
  return item;
};
