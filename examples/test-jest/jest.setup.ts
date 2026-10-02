import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
});
