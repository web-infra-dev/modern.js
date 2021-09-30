import { ICompilerResult, ICompilerMessageDetail } from './type';

export class CompilerErrorResult {
  _messageDetails!: ICompilerMessageDetail[];

  constructor(initErrorResult?: ICompilerResult) {
    this.init(initErrorResult);
  }

  init(initErrorResult?: ICompilerResult) {
    this._messageDetails = initErrorResult?.messageDetails || [];
  }

  update(messageDetails: ICompilerMessageDetail[]) {
    for (const messageDetail of messageDetails) {
      // 遍历存不存在该文件报错信息，不存在则增加，否则更新内容
      const addError = !this._messageDetails.some(detail => {
        if (detail.filename === messageDetail.filename) {
          // 如果错误栈里存在该文件报错信息，则更新内容
          detail.content = messageDetail.content;
          return true;
        }
        return false;
      });

      if (addError) {
        this._messageDetails.push(messageDetail);
      }
    }
  }

  removeByFileName(filename: string) {
    this._messageDetails = this._messageDetails.filter(
      detail => detail.filename !== filename,
    );
  }

  get value(): ICompilerResult {
    return {
      code: 1,
      message: `Compilation failure ${this._messageDetails?.length} files with Babel.`,
      messageDetails: this._messageDetails,
    };
  }

  checkExistError() {
    return this._messageDetails.length > 0;
  }
}
