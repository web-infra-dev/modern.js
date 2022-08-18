import { it, expect } from 'vitest';
import { add } from '../src';

it('should take a number and add it to another number', () => {
  expect(add(1, 2)).toBe(3);
});
