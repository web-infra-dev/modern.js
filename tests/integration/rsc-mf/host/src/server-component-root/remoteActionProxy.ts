'use server';

export async function proxyIncrementRemoteCount(
  previousState: number,
  formData: FormData,
) {
  const remote = await import('rscRemote/actions');
  return remote.incrementRemoteCount(previousState, formData);
}

export async function proxyRemoteActionEcho(value: string) {
  const remote = await import('rscRemote/actions');
  return remote.remoteActionEcho(value);
}

export async function proxyNestedRemoteAction(value: string) {
  const remote = await import('rscRemote/nestedActions');
  return remote.nestedRemoteAction(value);
}

export async function proxyDefaultRemoteAction(value: string) {
  const remote = await import('rscRemote/defaultAction');
  return remote.default(value);
}
