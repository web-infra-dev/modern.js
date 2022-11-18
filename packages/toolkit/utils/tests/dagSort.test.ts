import { dagSort } from '../src/dagSort';

describe('sort plugins', () => {
  it('should verfified each plugin', () => {
    const cases = [
      { name: '1', pre: [], post: [] },
      { name: '2', pre: [], post: [] },
      { name: '3', pre: ['1'], post: ['2'] },
      { name: '4', pre: [], post: [] },
      { name: '5', pre: ['6'], post: ['3'] },
      { name: '6', pre: [], post: [] },
    ];
    const result = dagSort(cases);
    const p_1_index = result.findIndex(item => item.name === '1');
    const p_2_index = result.findIndex(item => item.name === '2');
    const p_3_index = result.findIndex(item => item.name === '3');
    const p_5_index = result.findIndex(item => item.name === '5');
    const p_6_index = result.findIndex(item => item.name === '6');
    // is plugin 3 verified
    expect(p_2_index > p_3_index).toBeTruthy();
    expect(p_1_index < p_3_index).toBeTruthy();
    // is plugin 5 verified
    expect(p_5_index < p_3_index).toBeTruthy();
    expect(p_5_index > p_6_index).toBeTruthy();
  });

  it('should throw error when plugin has ring', () => {
    const cases = [
      { name: '1', pre: [], post: [] },
      { name: '2', pre: [], post: ['5'] },
      { name: '3', pre: ['1'], post: ['2'] },
      { name: '4', pre: [], post: [] },
      { name: '5', pre: ['6'], post: ['3'] },
      { name: '6', pre: [], post: [] },
    ];
    expect(() => {
      dagSort(cases);
    }).toThrow(/plugins dependences has loop: 2,3,5/);
  });
});
