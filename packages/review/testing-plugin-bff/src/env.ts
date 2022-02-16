import NodeEnvironment from 'jest-environment-node';
import { createApp } from './app';
import { bff_info_key } from './constant';

export default class extends NodeEnvironment {
  app: any;

  async setup() {
    const bff_info = (this.global as any)[bff_info_key];
    const { plugins } = bff_info;

    // eslint-disable-next-line no-multi-assign
    this.global.app = this.app = await createApp(
      bff_info.appDir,
      bff_info.modernUserConfig,
      plugins,
      bff_info.routes,
    );
  }

  async teardown() {
    await this.app?.server?.close();
  }
}
