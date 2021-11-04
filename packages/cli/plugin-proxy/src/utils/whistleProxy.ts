import path from 'path';
import { logger } from '@modern-js/utils';
import execSync from './execSync';
import {
  isRootCAExists,
  generateRootCA,
  defaultRootCA,
  trustRootCA,
} from './macCAManager';

const { disableGlobalProxy, enableGlobalProxy } = require('./macProxyManager');

interface ProxyConfig {
  rule: string;
  port: number;
  // mode: 'pureProxy'|'debug'|'multiEnv'
}

export default class WhistleProxy {
  private readonly rule: string;

  private readonly port: number;

  private readonly bin: string;

  private readonly certDir: string;

  constructor(config: ProxyConfig) {
    this.rule = config.rule;
    this.port = config.port;
    // unused
    // this.mode = config.mode; // pureProxy|debug|multiEnv
    this.bin = path.resolve(
      path.dirname(require.resolve('whistle')),
      'bin/whistle.js',
    );
    this.certDir = path.dirname(defaultRootCA);
  }

  async installRootCA() {
    try {
      if (!isRootCAExists()) {
        await generateRootCA();
        trustRootCA();
      }
    } catch (err) {
      this.close();
      throw err;
    }
  }

  async start() {
    logger.info(`Starting the proxy server.....`);
    execSync(`${this.bin} start --certDir=${this.certDir} --port=${this.port}`);
    execSync(`${this.bin} use ${this.rule} --force`);
    await this.installRootCA();

    enableGlobalProxy('127.0.0.1', this.port);
    logger.info(`Proxy Server start on localhost:${this.port}\n`);
  }

  close() {
    execSync(`${this.bin} stop`);
    disableGlobalProxy();
    logger.info(`Proxy Server has closed`);
  }
}
