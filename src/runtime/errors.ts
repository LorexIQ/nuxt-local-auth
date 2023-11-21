export class LocalAuthError extends Error {
    constructor(message: string = '') {
        super(message);
        this.name = 'LocalAuthError';
    }
}
