const RegList = {
  before: {
    head: '<head>',
    body: '<body>',
  },
  after: {
    head: '</head>',
    body: '</body>',
  },
};

class TemplateAPI {
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
    return this.replace(head, `${head}${fragment}`);
  }

  public appendHead(fragment: string) {
    const { head } = RegList.after;
    return this.replace(head, `${fragment}${head}`);
  }

  public prependBody(fragment: string) {
    const { body } = RegList.before;
    return this.replace(body, `${body}${fragment}`);
  }

  public appendBody(fragment: string) {
    const { body } = RegList.after;
    return this.replace(body, `${fragment}${body}`);
  }

  public replace(reg: RegExp | string, text: string) {
    this.content = this.content.replace(reg, text);
    return this;
  }
}

export const createTemplateAPI = (content: string) => new TemplateAPI(content);
