import { spawn } from 'node:child_process';

// The supervisor stays alive until the runner has audited the command's final
// descendants. Its group cannot be reused while that audit is in progress.
let started = false;
process.on('message', message => {
  if (message.type === 'release') process.exit(0);
  if (message.type !== 'start' || started) return;
  started = true;
  const child = spawn(message.command, message.args, { stdio: 'inherit' });
  child.on('error', error => {
    process.send?.({ type: 'finished', code: null, error: String(error) });
  });
  child.on('exit', (code, signal) => {
    process.send?.({ type: 'finished', code, signal });
  });
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => process.send?.({ type: 'interrupted', signal }));
}
process.on('disconnect', () => process.exit(1));
process.send?.({ type: 'ready' });
