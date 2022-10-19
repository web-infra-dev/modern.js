const formatErrors = require('../../src/core/formatErrors');
const expect = require('expect');

const simple = (errors) => errors
  .filter(error => !error.type).map(e => e.message);

const allCaps = (errors) => errors
  .filter(error => error.type == 'other').map(e => e.message.toUpperCase());

const notFound = (errors) => errors
  .filter(error => error.type === 'not-found').map(() => 'Not found');

const formatters = [allCaps];

it('formats the error based on the matching formatters', () => {
  const errors = [
    { message: 'Error 1', type: undefined },
    { message: 'Error 2', type: 'other' },
    { message: 'Error 3', type: 'not-found' },
  ];

  expect(formatErrors(errors, [simple, allCaps, notFound], 'Error')).toEqual([
    'Error 1',
    'ERROR 2',
    'Not found',
  ]);
});
