// eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
const wasmPath = new URL('./factorial.wasm', import.meta.url).pathname;

// eslint-disable-next-line no-undef
document.querySelector('#root').innerHTML = wasmPath;
