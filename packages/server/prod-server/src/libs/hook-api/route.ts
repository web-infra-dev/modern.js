export class RouteAPI {
  public current: string;

  public status: number;

  public url: string;

  constructor(entryName: string) {
    this.current = entryName;
    this.status = 200;
    this.url = '';
  }

  public redirect(url: string, status = 302) {
    this.url = url;
    this.status = status;
  }

  public rewrite(entryName: string) {
    this.current = entryName;
  }

  public use(entryName: string) {
    this.rewrite(entryName);
  }
}
