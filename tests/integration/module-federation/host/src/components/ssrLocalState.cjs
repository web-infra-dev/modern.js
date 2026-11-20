const seqKey = Symbol.for('weather-lab.host-local-module-seq');
const nextSeq =
  typeof window === 'undefined' ? (globalThis[seqKey] || 0) + 1 : undefined;
if (nextSeq !== undefined) globalThis[seqKey] = nextSeq;
module.exports = { localStateSeq: nextSeq };
