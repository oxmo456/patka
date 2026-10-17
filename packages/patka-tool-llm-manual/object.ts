import type {JsonObject} from '../json/json.ts';
import {createJsonObjectFromPatkaToolLLMManualProperties} from './patka-tool-llm-manual-properties.ts';
import type {PatkaToolLLMManualProperty} from './property.ts';

export function object(
  description: string,
  ...patkaToolLLMManualProperties: ReadonlyArray<PatkaToolLLMManualProperty>
): JsonObject {
  return {
    type: 'object',
    description,
    properties: createJsonObjectFromPatkaToolLLMManualProperties(patkaToolLLMManualProperties),
    required: patkaToolLLMManualProperties.map(
      (patkaToolLLMManualProperty: PatkaToolLLMManualProperty) => patkaToolLLMManualProperty.name,
    ),
  };
}
