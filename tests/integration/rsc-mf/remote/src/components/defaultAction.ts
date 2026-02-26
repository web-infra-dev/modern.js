'use server';

export async function defaultRemoteAction(value: string) {
  return `default-action:${value}`;
}
