import fs from 'fs'; // should be replaced by modern.js mock
import os from 'node:os'; // should be replaced by os-browserify
import path from 'path'; // should be replaced by path-browserify

console.log(fs);
console.log(path);
console.log(os);
export const value = Buffer.from('value');
