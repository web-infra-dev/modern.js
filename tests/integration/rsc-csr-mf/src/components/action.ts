'use server';
import { getCountState, setCountState } from './ServerState';

export async function greet(name: string) {
  return 'Hi';
}

export async function increment(num: number) {
  const currentNum = getCountState();
  setCountState(currentNum + num);
  return currentNum + num;
}

export async function incrementByForm(prevResult: number, formData: FormData) {
  const count = formData.get('count');
  const newCount = prevResult + Number(count);
  setCountState(newCount);
  return newCount;
}
