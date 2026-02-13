'use server';

let proxyRemoteCountState = 0;

export async function proxyIncrementRemoteCount(
  _previousState: number,
  formData: FormData,
) {
  const count = Number(formData.get('count') || 1);
  proxyRemoteCountState += count;
  return proxyRemoteCountState;
}

export async function proxyRemoteActionEcho(value: string) {
  return `remote-action:${value}`;
}

export async function proxyNestedRemoteAction(value: string) {
  return `nested-action:${value}`;
}

export async function proxyDefaultRemoteAction(value: string) {
  return `default-action:${value}`;
}
