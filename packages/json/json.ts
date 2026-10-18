export type JsonValue = string | number | boolean | null | ReadonlyArray<JsonValue> | JsonObject;

export type JsonObject = {
  readonly [key: string]: JsonValue;
};
