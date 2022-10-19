const utils = require('../../../src/utils');

const concat = utils.concat;
const uniqueBy = utils.uniqueBy;

it('concat should concat removing undefined and null values', () => {
  const result = concat(1, undefined, '', null);
  expect(result).toEqual(
    [1, '']
  );
});

it('concat should handle arrays', () => {
  const result = concat(1, [2, 3], null);
  expect(result).toEqual(
    [1, 2, 3]
  );
});

it('uniqueBy should dedupe based on criterion returned from iteratee function', () => {
  const result = uniqueBy([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 3 }], function(val) {
    return val.id;
  });
  expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
});
