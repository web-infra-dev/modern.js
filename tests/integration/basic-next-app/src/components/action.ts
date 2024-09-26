'use server';
import { getCountState, setCountState } from './ServerState';

export async function greet(name: string) {
  console.log('hihihi', name);
  return 'Hi ';
}

export async function increment(num: number) {
  const currentNum = getCountState();
  setCountState(currentNum + num);
}
