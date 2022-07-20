export class HttpError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends HttpError {
  private code: string;

  constructor(status: number, message: string) {
    super(status, message);
    this.code = 'VALIDATION_ERROR';
  }
}
