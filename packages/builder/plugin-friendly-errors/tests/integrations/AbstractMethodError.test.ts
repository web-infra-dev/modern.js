import CommentCompilationWarning from 'webpack5/lib/CommentCompilationWarning';
import { describe, it, expect } from 'vitest';

describe('CommentCompilationWarning', () => {
  it('should print raw error', () => {
    const error = new CommentCompilationWarning('foo', {
      start: { line: 1, column: 10 },
      end: { line: 3, column: 20 },
      index: 2,
    });
    expect(() => {
      throw error;
    }).toThrowErrorMatchingSnapshot();
  });
});
