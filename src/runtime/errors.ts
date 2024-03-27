export class LocalAuthError extends Error {
  error?: Error;

  constructor(e?: Error, message?: string, handler?: string) {
      super((handler ? (handler + (message ? ': ' : '')) : '') + message);
      this.name = 'LocalAuthError';
      this.error = e;
  }
}
