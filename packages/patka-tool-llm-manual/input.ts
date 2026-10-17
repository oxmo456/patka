import type {JsonObjectSchema} from '../json/json.ts';
import {createJsonObjectFromPatkaToolLLMManualProperties} from './patka-tool-llm-manual-properties.ts';
import type {PatkaToolLLMManualProperty} from './property.ts';

export function input(
  ...patkaToolLLMManualProperties: ReadonlyArray<PatkaToolLLMManualProperty>
): JsonObjectSchema {
  return {
    type: 'object',
    properties: createJsonObjectFromPatkaToolLLMManualProperties(patkaToolLLMManualProperties),
    required: patkaToolLLMManualProperties.map(
      (patkaToolLLMManualProperty: PatkaToolLLMManualProperty) => patkaToolLLMManualProperty.name,
    ),
  };
}
