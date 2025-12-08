// Polyfill for TextEncoder/TextDecoder in test environment
const { TextEncoder, TextDecoder } = require('util');

// Set global for both Node.js and jsdom environments
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
