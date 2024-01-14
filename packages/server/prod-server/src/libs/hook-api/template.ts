export const RegList = {
  before: {
    head: '<head[^>]*>',
    body: '<body[^>]*>',
  },
  after: {
    head: '</head>',
    body: '</body>',
  },
};

export class TemplateAPI {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  public get() {
    return this.content;
  }

  public set(content: string) {
    this.content = content;
  }

  public prependHead(fragment: string) {
    const { head } = RegList.before;
    return this.replaceByFunction(
      new RegExp(head),
      beforeHead => `${beforeHead}${fragment}`,
    );
  }

  public appendHead(fragment: string) {
    const { head } = RegList.after;
    return this.replace(head, `${fragment}${head}`);
  }

  public prependBody(fragment: string) {
    const { body } = RegList.before;
    return this.replaceByFunction(
      new RegExp(body),
      beforeBody => `${beforeBody}${fragment}`,
    );
  }

  public appendBody(fragment: string) {
    const { body } = RegList.after;
    return this.replace(body, `${fragment}${body}`);
  }

  private replaceByFunction(
    reg: RegExp | string,
    replacer: (substring: string, ...others: any[]) => string,
  ) {
    this.content = this.content.replace(reg, replacer);
  }

  private replace(reg: RegExp | string, text: string) {
    this.content = this.content.replace(reg, text);
  }
}
