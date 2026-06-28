export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = <T extends (...args: never[]) => Promise<unknown>>(fn: T) => {
  return (...args: Parameters<T>) => {
    const result = fn(...args);
    return Promise.resolve(result).catch(args[2]);
  };
};
