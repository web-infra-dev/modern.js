declare module 'http' {
  interface ServerResponse {
    locals: Record<string, any>;
  }
}
