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
  return remote.defaultRemoteAction(value);
}

export async function proxyBundledIncrementRemoteCount(
  previousState: number,
  formData: FormData,
) {
  const remote = await import('rscRemote/actionBundle');
  return remote.bundledIncrementRemoteCount(previousState, formData);
}

export async function proxyBundledRemoteActionEcho(value: string) {
  const remote = await import('rscRemote/actionBundle');
  return remote.bundledRemoteActionEcho(value);
}

export async function proxyBundledNestedRemoteAction(value: string) {
  const remote = await import('rscRemote/actionBundle');
  return remote.bundledNestedRemoteAction(value);
}

export async function proxyBundledDefaultRemoteAction(value: string) {
  const remote = await import('rscRemote/actionBundle');
  return remote.bundledDefaultRemoteAction(value);
}
