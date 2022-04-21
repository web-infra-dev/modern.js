/**
 * Appends an event listener on exit process.
 * It will listen to the `exit` and `SIGINT` events of process.
 */
export function onExitProcess(listener: NodeJS.ExitListener) {
  let done = false;

  const callListener = (code: number) => {
    if (!done) {
      done = true;
      listener(code);
    }
  };

  // process.exit
  process.on('exit', callListener);
  // Ctrl + C
  process.on('SIGINT', callListener);
}
