'use server';

export default async function defaultRemoteAction(value: string) {
  return `default-action:${value}`;
}
