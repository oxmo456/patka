import type {JsonObject} from '../json/json.ts';
import type {PatkaToolLLMManualProperty} from './property.ts';

export function createJsonObjectFromPatkaToolLLMManualProperties(
  patkaToolLLMManualProperties: ReadonlyArray<PatkaToolLLMManualProperty>,
): JsonObject {
  return Object.fromEntries(
    patkaToolLLMManualProperties.map((patkaToolLLMManualProperty: PatkaToolLLMManualProperty) => [
      patkaToolLLMManualProperty.name,
      patkaToolLLMManualProperty.schema,
    ]),
  );
}
