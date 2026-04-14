declare global {
  interface Window {
    __pre_entry_flag?: number;
  }
}

window.__pre_entry_flag = 1;

export {};
