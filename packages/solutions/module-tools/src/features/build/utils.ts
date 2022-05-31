import * as os from 'os';
import { Import } from '@modern-js/utils';

const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);

/**
 * 处理日志信息
 */
export class LogStack {
  private _codeLogStack: string[];

  constructor() {
    this._codeLogStack = [];
  }

  update(latestLog: string, { splitEOL = false } = {}) {
    if (splitEOL) {
      latestLog.split(os.EOL).forEach(log => {
        this._codeLogStack.unshift(log.trim());
      });
      return;
    }

    this._codeLogStack.unshift(latestLog.trim());
  }

  clear() {
    this._codeLogStack = [];
  }

  get value() {
    return [...new Set(this._codeLogStack)];
  }
}

export const logTemplate = (
  title: string,
  messageStack: string[],
  maxLength: number,
  {
    noBottomBorder = false,
    bottomBorderText = '',
    noLeftBorder = false,
    leftBorder = '│',
    contentColor = (s: string) => s,
  } = {},
) => {
  const leftBorderFlag = noLeftBorder ? '' : leftBorder;
  const messageFragments = messageStack
    .map(p => {
      p.trim();

      return `${leftBorderFlag}${p.replace(constants.clearFlag, '')}`;
    }) // 移除 clearFlag
    .slice(0, maxLength) // 控制长度
    .filter(s => s !== leftBorderFlag) // 过滤空字符串
    .reverse(); // 调换顺序，最新的消息在最后面
  const template = `${title}:
${contentColor(messageFragments.join(os.EOL))}${
    noBottomBorder ? '' : `\n${bottomBorderText}`
  }`;
  return template;
};
