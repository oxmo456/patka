export type JsonValue = string | number | boolean | null | ReadonlyArray<JsonValue> | JsonObject;

export type JsonObject = {
  readonly [key: string]: JsonValue;
};

export type JsonObjectSchema = {
  readonly type: 'object';
  readonly properties: JsonObject;
  readonly required: ReadonlyArray<string>;
};

export type JsonSchema = {
  readonly type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  readonly description?: string;
  readonly properties?: JsonObject;
  readonly items?: JsonObject;
  readonly required?: ReadonlyArray<string>;
};
