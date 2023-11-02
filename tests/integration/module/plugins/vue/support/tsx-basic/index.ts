import { createApp } from 'vue';
import A from './A';

export const B: any = A;

console.log(A);

createApp(A).mount('#root');
