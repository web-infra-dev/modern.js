const { localStateSeq } = require('./ssrLocalState.cjs') as {
  localStateSeq?: number;
};

export function HostLocalStateBadge() {
  if (!process.env.MF_LAB_UPDATES) return null;
  const seq =
    localStateSeq ??
    (typeof document !== 'undefined'
      ? document
          .querySelector('[data-testid="host-local-state"]')
          ?.getAttribute('data-seq')
      : undefined) ??
    '1';
  return (
    <div
      className="host-local-state-badge"
      data-testid="host-local-state"
      data-seq={String(seq)}
      title="Unrelated Host SSR module state: stays #1 across Partial updates, increments across Application updates"
    >
      Host SSR state #{seq}
    </div>
  );
}
