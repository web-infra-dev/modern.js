export function reportRecovery(
  status: string,
  remote: string,
  handler: string,
) {
  if (typeof window === 'undefined') return;
  const event = { status, remote, handler };
  const target = window as typeof window & { labRecoveries?: (typeof event)[] };
  target.labRecoveries ??= [];
  if (
    target.labRecoveries.some(
      item => JSON.stringify(item) === JSON.stringify(event),
    )
  )
    return;
  target.labRecoveries.push(event);
  window.parent.postMessage(
    { type: 'mf-lab-recovery', ...event },
    window.location.origin,
  );
}
