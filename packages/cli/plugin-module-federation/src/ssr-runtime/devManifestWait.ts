// Private development transport. Ordinary manifest reads keep returning 503
// while the producer is compiling.
export const DEV_MANIFEST_WAIT_HEADER = 'x-modern-mf-dev-wait';
export const DEV_MANIFEST_WAIT_TIMEOUT = 30_000;
