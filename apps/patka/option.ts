export type Some<T> = {
  readonly type: "some";
  readonly value: T;
};

export type None = {
  readonly type: "none";
};

export type Option<T> = Some<T> | None;

export const none: None = { type: "none" };

export const some = <T>(value: T): Some<T> => ({ type: "some", value });

export const isSome = <T>(option: Option<T>): option is Some<T> => option.type === "some";
