const RegList = {
  before: {
    head: '<head[^>]*>',
    body: '<body[^>]*>',
  },
  after: {
    head: '</head>',
    body: '</body>',
  },
};

export class TemplateApi {
  private body: string;

  constructor(body: string) {
    this.body = body;
  }

  set(content: string) {
    this.body = content;
  }

  get(): string {
    return this.body;
  }

  prependHead(fragment: string) {
    const { head } = RegList.before;

    this.replaceBody(
      new RegExp(head),
      beforeHead => `${beforeHead}${fragment}`,
    );
  }

  appendHead(fragment: string) {
    const { head } = RegList.after;
    this.replaceBody(head, () => `${fragment}${head}`);
  }

  prependBody(fragment: string) {
    const { body } = RegList.before;

    this.replaceBody(
      new RegExp(body),
      beforeBody => `${beforeBody}${fragment}`,
    );
  }

  appendBody(fragment: string) {
    const { body } = RegList.after;
    this.replaceBody(body, () => `${fragment}${body}`);
  }

  private replaceBody(
    searchValue: string | RegExp,
    replaceCb: (before: string) => string,
  ) {
    this.body = this.body.replace(searchValue, replaceCb);
  }
}
