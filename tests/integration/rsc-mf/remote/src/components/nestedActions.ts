'use server';

export async function nestedRemoteAction(value: string) {
  return `nested-action:${value}`;
}
