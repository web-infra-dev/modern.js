'use server';

let remoteCountState = 0;

export async function incrementRemoteCount(
  _previousState: number,
  formData: FormData,
) {
  const count = Number(formData.get('count') || 1);
  remoteCountState += count;
  return remoteCountState;
}

export async function remoteActionEcho(value: string) {
  return `remote-action:${value}`;
}
