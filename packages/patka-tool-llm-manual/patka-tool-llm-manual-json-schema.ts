import type {JsonObject, JsonValue} from '../json/json.ts';
import {object} from '../json-schema/object.ts';
import {property} from '../json-schema/property.ts';
import type {PatkaToolLLMManual} from './patka-tool-llm-manual.ts';

export type PatkaToolLLMManualJsonSchema = {
  readonly input: JsonObject;
  readonly output: JsonObject;
};

export function patkaToolLLMManualJsonSchema<
  InvocationInput extends JsonObject,
  InvocationOutput extends JsonValue,
>(
  patkaToolLLMManual: PatkaToolLLMManual<InvocationInput, InvocationOutput>,
): PatkaToolLLMManualJsonSchema {
  return {
    input: object(
      patkaToolLLMManual.input.title,
      patkaToolLLMManual.input.description,
      Object.fromEntries(
        Object.entries(patkaToolLLMManual.input.properties).map(([key, propertyLLMManual]) => [
          key,
          property(propertyLLMManual.value, propertyLLMManual.description),
        ]),
      ),
    ),
    output: property(patkaToolLLMManual.output.value, patkaToolLLMManual.output.description),
  };
}
