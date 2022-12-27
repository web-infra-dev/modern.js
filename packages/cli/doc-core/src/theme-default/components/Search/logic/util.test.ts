import { expect, test, describe } from 'vitest';
import { backTrackHeaders } from './util';

describe('utils logic', () => {
  test('back track the headers', () => {
    const headers = [
      { depth: 1, text: '1', id: '1' },
      { depth: 2, text: '2', id: '2' },
      { depth: 3, text: '3', id: '3' },
      { depth: 4, text: '4', id: '4' },
      { depth: 5, text: '5', id: '5' },
    ];
    const res = backTrackHeaders(headers, 3);
    expect(res).toEqual([
      { depth: 2, text: '2', id: '2' },
      { depth: 3, text: '3', id: '3' },
      { depth: 4, text: '4', id: '4' },
    ]);
  });
});
