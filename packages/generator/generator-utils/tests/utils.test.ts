import path from 'path';
import { getSolutionFromDependance } from '../src/utils';

describe('generator-utils test', () => {
  it('getSolutionFromDependance', () => {
    const json1 = path.join(__dirname, 'fixtures/mwa.json');
    expect(getSolutionFromDependance(json1)).toBe('mwa');

    const json2 = path.join(__dirname, 'fixtures/err.json');
    expect(() => getSolutionFromDependance(json2)).toThrow(
      'Multiple solutions found: mwa,module',
    );

    const json3 = path.join(__dirname, 'fixtures/none.json');
    expect(() => getSolutionFromDependance(json3)).toThrow(
      'No solution found. Please check your package.json.',
    );
  });
});
