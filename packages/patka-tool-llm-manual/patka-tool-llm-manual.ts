import type {JsonObjectSchema, JsonSchema} from '../json/json.ts';

export type PatkaToolLLMManual = {
  readonly name: string;
  readonly usage: string;
  readonly input: JsonObjectSchema;
  readonly output: JsonSchema;
};

export function patkaToolLLMManual(
  name: string,
  usage: string,
  jsonObjectSchema: JsonObjectSchema,
  jsonSchema: JsonSchema,
): PatkaToolLLMManual {
  return {name, usage, input: jsonObjectSchema, output: jsonSchema};
}
