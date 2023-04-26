import _ from '@modern-js/utils/lodash';
import StackTracey from '../../compiled/stacktracey';
import { ErrorTransformer } from '../shared/types';

export const compareTraces = (
  trace1: readonly StackTracey.Entry[],
  trace2: readonly StackTracey.Entry[],
) => {
  if (trace1.length !== trace2.length) {
    return false;
  }
  for (let i = 0; i < trace1.length; i++) {
    const s1 = trace1[i];
    const s2 = trace2[i];
    if (s1.file !== s2.file || s1.line !== s2.line || s1.column !== s2.column) {
      return false;
    }
  }
  return true;
};

export const compareTraceFragments = (
  trace1: readonly StackTracey.Entry[],
  trace2: readonly StackTracey.Entry[],
) => {
  const len = Math.min(trace1.length, trace2.length);
  return compareTraces(
    trace1.length === len ? trace1 : trace1.slice(0, len),
    trace2.length === len ? trace2 : trace2.slice(0, len),
  );
};

export const mergeTraceHeads = (traces: StackTracey.Entry[][]) => {
  const heads: StackTracey.Entry[] = [];
  const tails: StackTracey.Entry[] = [];
  for (const [head, ...rest] of traces) {
    if (!heads.length) {
      heads.push(head);
      tails.push(...rest);
    } else if (compareTraceFragments(tails, rest)) {
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
