import path from 'path';
import { getSolutionFromDependance } from '../src/utils';

describe('generator-utils test', () => {
  it('getSolutionFromDependance: default map', () => {
    const json1 = path.join(__dirname, 'fixtures/mwa.json');
    expect(getSolutionFromDependance(json1)).toEqual({
      solution: 'mwa',
      dependence: '@modern-js/app-tools',
    });
  });

  it('getSolutionFromDependance: mutiple solutions throw error', () => {
    const json2 = path.join(__dirname, 'fixtures/err.json');
    expect(() => getSolutionFromDependance(json2)).toThrow(
      'Multiple solutions found: mwa,module',
    );
  });

  it('getSolutionFromDependance: no solution throw error', () => {
    const json3 = path.join(__dirname, 'fixtures/none.json');
    expect(() => getSolutionFromDependance(json3)).toThrow(
      'No solution found. Please check your package.json.',
    );
  });

  it('getSolutionFromDependance: custom map', () => {
    const json4 = path.join(__dirname, 'fixtures/custom.json');
    expect(
      getSolutionFromDependance(json4, {
        aaabbb: '@aaa/bbb',
      }),
    ).toEqual({
      solution: 'aaabbb',
      dependence: '@aaa/bbb',
    });
  });
});
