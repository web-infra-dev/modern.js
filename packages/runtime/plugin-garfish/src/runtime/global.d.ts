import garfish from 'garfish';

declare global {
  interface Window {
    Garfish: typeof garfish;
  }
}
