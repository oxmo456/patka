import type {JsonValue} from '../json/json.ts';

export type JsonValueTypeNameOf<Value> = Value extends string
  ? 'string'
  : Value extends number
    ? 'number'
    : Value extends boolean
      ? 'boolean'
      : Value extends ReadonlyArray<JsonValue>
        ? 'array'
        : never;
