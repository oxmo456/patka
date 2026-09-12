import type {JsonObjectSchema, JsonSchema} from '../json.ts';

export type PatkaToolManual = {
  readonly name: string;
  readonly summary: string;
  readonly usage: string;
  readonly input: JsonObjectSchema;
  readonly output: JsonSchema;
};
