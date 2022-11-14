import _ from '@modern-js/utils/lodash';
import StackTracey from 'stacktracey';
import { ErrorTransformer } from '../shared/types';

export const compareStack = (
  stack1: readonly StackTracey.Entry[],
  stack2: readonly StackTracey.Entry[],
) => {
  if (stack1.length !== stack2.length) {
    return false;
  }
  for (let i = 0; i < stack1.length; i++) {
    const s1 = stack1[i];
    const s2 = stack2[i];
    if (s1.file !== s2.file || s1.line !== s2.line || s1.column !== s2.column) {
      return false;
    }
  }
  return true;
};

export const compareStackFragments = (
  stack1: readonly StackTracey.Entry[],
  stack2: readonly StackTracey.Entry[],
) => {
  const len = Math.min(stack1.length, stack2.length);
  return compareStack(
    stack1.length === len ? stack1 : stack1.slice(0, len),
    stack2.length === len ? stack2 : stack2.slice(0, len),
  );
};

export const mergeTraceHeads = (traces: StackTracey.Entry[][]) => {
  const heads: StackTracey.Entry[] = [];
  const tails: StackTracey.Entry[] = [];
  for (const [head, ...rest] of traces) {
    if (!heads.length) {
      heads.push(head);
      tails.push(...rest);
    } else if (compareStackFragments(tails, rest)) {
      heads.push(head);
    } else {
      return null;
    }
  }
  return [...heads, ...tails];
};

export const flattenErrorCauses: ErrorTransformer = e => {
  const traces = [e.trace, ..._.map(e.causes, 'trace')];
  const merged = mergeTraceHeads(traces);
  if (merged) {
    e.trace = merged;
    e.causes = [];
  }
  return e;
};
