export type Success<T> = {
  readonly type: 'success';
  readonly value: T;
};

export type Failure = {
  readonly type: 'failure';
  readonly error: Error;
};

export type Try<T> = Success<T> | Failure;

export const success = <T>(value: T): Success<T> => ({type: 'success', value});

export const failure = (error: Error): Failure => ({type: 'failure', error});

export const isSuccess = <T>(attempted: Try<T>): attempted is Success<T> =>
  attempted.type === 'success';

export const attempt = <T>(run: () => T): Try<T> => {
  try {
    return success(run());
  } catch (thrown) {
    return failure(thrown instanceof Error ? thrown : new Error(String(thrown)));
  }
};
