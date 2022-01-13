import {
  removeLeadingSlash,
  removeSlash,
  removeTailSlash,
} from '../src/removeSlash';

describe('remove slash', () => {
  test(`should remove leading slash`, () => {
    expect(removeLeadingSlash('///yuck/example//')).toEqual('yuck/example//');
  });

  test(`should remove tail slash`, () => {
    expect(removeTailSlash('///yuck/example//')).toEqual('///yuck/example');
  });

  test(`should remove slash`, () => {
    expect(removeSlash('///yuck/example//')).toEqual('yuck/example');
  });
});
