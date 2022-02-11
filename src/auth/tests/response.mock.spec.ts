export class ResponseMock {
  public cookies = '';
  public options: any;

  public cookie(name: string, token: string, options?: any) {
    this.cookies = `${name}=${token}`;
    if (options) this.options = options;
  }

  public clearCookie(name: string) {
    if (this.cookies.split('=')[0] === name) {
      this.cookies = '';
    }
  }
}
