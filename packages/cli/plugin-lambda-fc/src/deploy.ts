import path from 'path';
import AliyunDeploy from '@alicloud/fun/lib/commands/deploy';

process.on('SIGINT', () => {
  // eslint-disable-next-line no-process-exit
  process.exit();
});

AliyunDeploy({
  template: path.join(process.cwd(), 'template.yml'),
  assumeYes: true,
});
