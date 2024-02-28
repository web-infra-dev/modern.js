import path from 'path';
import { getSolutionByDependance } from '../src/utils';

describe('new action utils test', () => {
  it('getSolutionByDependance', () => {
    const json1 = path.join(__dirname, 'fixtures/mwa.json');
    expect(getSolutionByDependance(json1)).toBe('mwa');

    const json2 = path.join(__dirname, 'fixtures/err.json');
    expect(() => getSolutionByDependance(json2)).toThrow(
      'Multiple solutions found: mwa,module',
    );

    const json3 = path.join(__dirname, 'fixtures/none.json');
    expect(() => getSolutionByDependance(json3)).toThrow(
      'No solution found. Please check your package.json.',
    );
  });
});
