import { createPlugin } from '../core';

let number = 0;
export const getNumber = () => number;

export const setNumber = (newNumber: number) => {
  number = newNumber;
};

const bar = createPlugin(() => {
  number = 1;
  return {
    preDev: async () => {},
    fooWaterfall: async input => {
      number = 2;
      return input;
    },
  };
});

export default bar;
