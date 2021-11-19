import serverless from '@serverless/components';

process.on('SIGINT', () => {
  // eslint-disable-next-line no-process-exit
  process.exit();
});

serverless.runComponents();
