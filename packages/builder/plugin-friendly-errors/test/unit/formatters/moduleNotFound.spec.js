const moduleNotFound = require('../../../src/formatters/moduleNotFound');
const expect = require('expect');

it('Formats module-not-found errors', () => {
  const error = { type: 'module-not-found', module: 'redux' };
  expect(moduleNotFound([error])).toEqual([
    'This dependency was not found:',
    '',
    '* redux',
    '',
    'To install it, you can run: npm install --save redux'
  ]);
});

it('Groups all module-not-found into one', () => {
  const reduxError = { type: 'module-not-found', module: 'redux' };
  const reactError = { type: 'module-not-found', module: 'react' };
  expect(moduleNotFound([reduxError, reactError])).toEqual([
    'These dependencies were not found:',
    '',
    '* redux',
    '* react',
    '',
    'To install them, you can run: npm install --save redux react'
  ]);
});

it('Groups same module in module-not-found with 2 files', () => {
  const reduxError = { type: 'module-not-found', module: 'redux' };
  const reactError1 = { type: 'module-not-found', module: 'react', file: './src/file1.js' };
  const reactError2 = { type: 'module-not-found', module: 'react', file: '../src/file2.js' };
  expect(moduleNotFound([reduxError, reactError1, reactError2])).toEqual([
    'These dependencies were not found:',
    '',
    '* redux',
    '* react in ./src/file1.js, ../src/file2.js',
    '',
    'To install them, you can run: npm install --save redux react'
  ]);
});

it('Groups same module in module-not-found with 3 files', () => {
  const reduxError = { type: 'module-not-found', module: 'redux' };
  const reactError1 = { type: 'module-not-found', module: 'react', file: './src/file1.js' };
  const reactError2 = { type: 'module-not-found', module: 'react', file: './src/file2.js' };
  const reactError3 = { type: 'module-not-found', module: 'react', file: './src/file3.js' };
  expect(moduleNotFound([reduxError, reactError1, reactError2, reactError3])).toEqual([
    'These dependencies were not found:',
    '',
    '* redux',
    '* react in ./src/file1.js, ./src/file2.js and 1 other',
    '',
    'To install them, you can run: npm install --save redux react'
  ]);
});

it('Groups same module in module-not-found with 4 files', () => {
  const reduxError = { type: 'module-not-found', module: 'redux' };
  const reactError1 = { type: 'module-not-found', module: 'react', file: './src/file1.js' };
  const reactError2 = { type: 'module-not-found', module: 'react', file: './src/file2.js' };
  const reactError3 = { type: 'module-not-found', module: 'react', file: './src/file3.js' };
  const reactError4 = { type: 'module-not-found', module: 'react', file: './src/file4.js' };
  expect(moduleNotFound([reduxError, reactError1, reactError2, reactError3, reactError4])).toEqual([
    'These dependencies were not found:',
    '',
    '* redux',
    '* react in ./src/file1.js, ./src/file2.js and 2 others',
    '',
    'To install them, you can run: npm install --save redux react'
  ]);
});

it('Does not format other errors', () => {
  const otherError = { type: 'other-error', module: 'foo' };
  expect(moduleNotFound([otherError])).toEqual([]);
});
