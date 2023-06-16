import { _Z4facti } from './factorial.wasm';

const factorial = _Z4facti;

// eslint-disable-next-line no-undef
document.querySelector('#root').innerHTML = factorial(3);
