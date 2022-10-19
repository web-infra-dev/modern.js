const moduleNotFound = require('../../../src/transformers/moduleNotFound');
const expect = require('expect');

const error = {
  name: 'ModuleNotFoundError',
  message: 'Module not found : redux',
  webpackError: {
    dependencies: [{ request: 'redux' } ],
  },
};

it('Sets severity to 900', () => {
  expect(moduleNotFound(error).severity).toEqual(900);
});

it('Sets module name', () => {
  expect(moduleNotFound(error).module).toEqual('redux');
});

it('Sets the appropiate message', () => {
  const message = 'Module not found redux';
  expect(moduleNotFound(error).message).toEqual(message);
});

it('Sets the appropiate type', () => {
  expect(moduleNotFound({
    name: 'ModuleNotFoundError',
    message: 'Module not found',
    webpackError: error.webpackError,
  }).type).toEqual('module-not-found');
});

it('Ignores other errors', () => {
  const error = { name: 'OtherError' };
  expect(moduleNotFound(error)).toEqual(error);
});