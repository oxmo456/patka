import type {JsonObject, JsonValue} from '../json/json.ts';
import type {JsonValueTypeNameOf} from './json-value-type-name-of.ts';
import type {ObjectJsonSchemaLLMManual} from './object-json-schema-llm-manual.ts';
import type {PropertyJsonSchemaLLMManual} from './property-json-schema-llm-manual.ts';

export type PatkaToolLLMManual<
  InvocationInput extends JsonObject,
  InvocationOutput extends JsonValue,
> = {
  readonly name: string;
  readonly input: ObjectJsonSchemaLLMManual<InvocationInput>;
  readonly output: PropertyJsonSchemaLLMManual<JsonValueTypeNameOf<InvocationOutput>>;
};

export function patkaToolLLMManual<
  InvocationInput extends JsonObject,
  InvocationOutput extends JsonValue,
>(
  name: string,
  input: ObjectJsonSchemaLLMManual<InvocationInput>,
  output: PropertyJsonSchemaLLMManual<JsonValueTypeNameOf<InvocationOutput>>,
): PatkaToolLLMManual<InvocationInput, InvocationOutput> {
  return {name, input, output};
}
