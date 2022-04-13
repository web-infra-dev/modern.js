import type { ChildProcess } from 'child_process';
import { Signale, SignaleOptions } from '@modern-js/utils';
import { formatLog } from './utils';

export interface ITaskLogProviderConfig {
  stdout: ChildProcess['stdout'] | NodeJS.ReadStream;
  stderr: ChildProcess['stderr'] | NodeJS.ReadStream;
  logConfig: {
    label?: string;
    color?: string;
    badge?: string;
    header?: string;
    footer?: string;
    contentLength?: number;
  };
}

const createLogger = (
  name: string,
  config: ITaskLogProviderConfig['logConfig'],
) => {
  const options: SignaleOptions = {
    scope: config.label ? config.label + name : name,
    types: {
      info: {
        badge: '',
        color: 'blue',
        label: '',
      },
    },
  };
  return new Signale(options);
};

const createListenHandler = (
  name: string,
  config: ITaskLogProviderConfig['logConfig'],
) => {
  // const sb = new StringBuilder();
  const logger = createLogger(name, config);
  // eslint-disable-next-line node/prefer-global/buffer
  const stdout = (chunk: Buffer) => {
    // console.info(chunk.toString().split(/\r\n|\n\r|\r|\n/g).length);
    logger.info(formatLog(chunk.toString()));
  };
  // eslint-disable-next-line node/prefer-global/buffer
  const stderr = (chunk: Buffer) => {
    logger.error(chunk.toString());
    // logger.log('#####################');
  };
  return { stdout, stderr };
};

export class MultitasksLogger {
  private readonly _taskNameList: string[];

  private readonly _taskStdoutListenerMap: Map<
    string,
    ITaskLogProviderConfig['stdout']
  >;

  private readonly _taskStderrListenerMap: Map<
    string,
    ITaskLogProviderConfig['stderr']
  >;

  private readonly _taskLogConfigMap: Map<string, ITaskLogProviderConfig>;

  constructor() {
    this._taskNameList = [];
    this._taskStdoutListenerMap = new Map();
    this._taskStderrListenerMap = new Map();
    this._taskLogConfigMap = new Map();
  }

  addLogProvider(name: string, config: ITaskLogProviderConfig) {
    if (this._taskNameList.includes(name)) {
      this._taskStdoutListenerMap.get(name)?.removeAllListeners();
      this._taskStderrListenerMap.get(name)?.removeAllListeners();
      this._taskStdoutListenerMap.delete(name);
      this._taskStderrListenerMap.delete(name);
    }

    this._taskNameList.push(name);
    this._taskLogConfigMap.set(name, config);
    this._taskStdoutListenerMap.set(name, config.stdout);
    this._taskStderrListenerMap.set(name, config.stderr);
    this.startListen(name);
  }

  startListen(taskName: string) {
    const listenHandler = createListenHandler(
      taskName,
      this._taskLogConfigMap.get(taskName)!.logConfig,
    );
    this._taskStdoutListenerMap.get(taskName)!.on('data', listenHandler.stdout);
    this._taskStdoutListenerMap
      .get(taskName)!
      .on('error', listenHandler.stderr);
    this._taskStderrListenerMap.get(taskName)!.on('data', listenHandler.stderr);
  }

  startListenAll() {
    for (const taskName of this._taskNameList) {
      this.startListen(taskName);
    }
  }

  finishListen() {
    // 是否需要
  }
}
