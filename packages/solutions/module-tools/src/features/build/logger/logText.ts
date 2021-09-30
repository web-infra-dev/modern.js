import { chalk } from '@modern-js/utils';

export const colors = { title: chalk.rgb(218, 152, 92) };

export const clearFlag = '\x1Bc';

export const logTemplate = (
  title: string,
  messageStack: string[],
  {
    noBottomBorder = false,
    bottomBorderText = '',
    noLeftBorder = false,
    leftBorder = '',
    contentColor = (s: string) => s,
  } = {},
) => {
  const maxLength = Infinity; // TODO: 考虑后面是否提供该参数
  const leftBorderFlag = noLeftBorder ? '' : leftBorder;
  const messageFragments = messageStack
    .map(p => {
      p.trim();

      return `${leftBorderFlag}${p.replace(clearFlag, '')}`;
    }) // 移除 clearFlag
    .filter(s => s !== leftBorderFlag) // 过滤空字符串
    .slice(0, maxLength); // 控制长度
  const template = `${colors.title(title)}:
${contentColor(messageFragments.join(''))}${
    noBottomBorder ? '' : `\n${bottomBorderText}`
  }`;
  return template;
};

export interface LoggerTextOption {
  title: string;
  contentConfig?: {
    noBottomBorder?: boolean;
    bottomBorderText?: string;
    noLeftBorder?: boolean;
    leftBorder?: string;
    contentColor?: (s: string) => string;
    replace?: string[];
  };
}
// 处理Log内容如何展示
export class LoggerText {
  messages: string[];

  hasErrorMessage: boolean;

  option: LoggerTextOption;

  constructor(option: LoggerTextOption) {
    this.messages = [];
    this.option = option;
    this.hasErrorMessage = false;
  }

  append(message: string) {
    if (message.includes(clearFlag)) {
      this.messages = [];
    }
    this.messages.push(message);
  }

  errorHappen() {
    this.hasErrorMessage = true;
  }

  hasMessages() {
    return this.messages.length > 0;
  }

  get value() {
    const { title, contentConfig } = this.option;
    const messages = [...new Set(this.messages)];
    return logTemplate(title, messages, contentConfig);
  }
}
