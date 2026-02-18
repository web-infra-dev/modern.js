export async function loadRemoteActionsDynamically() {
  const actionModule = await import('./actions');
  return actionModule;
}
