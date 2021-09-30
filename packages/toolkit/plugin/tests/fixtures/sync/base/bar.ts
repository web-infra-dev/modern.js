import { createPlugin } from '../core';
import { register } from './fooManager';

let count = 0;
export const getBar = () => count;
register(() => {
  count = 1;

  return {
    fooWaterfall: () => {
      count = 2;
    },
    fooWorflow: () => {
      count = 3;
    },
  };
});

const bar = createPlugin(() => ({}), { post: ['foo'] });

export default bar;
