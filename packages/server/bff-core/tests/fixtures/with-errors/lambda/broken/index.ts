// This file intentionally throws an error on load to test error handling
throw new Error('intentional load error');

export const get = () => 'never reached';
