import type {JsonObject} from '../json/json.ts';
import type {PropertiesJsonSchemaLLMManual} from './properties-json-schema-llm-manual.ts';

export type ObjectJsonSchemaLLMManual<T extends JsonObject> = {
  readonly type: 'ObjectJsonSchemaLLMManual';
  readonly title: string;
  readonly description: string;
  readonly properties: PropertiesJsonSchemaLLMManual<T>;
};

export function objectJsonSchemaLLMManual<T extends JsonObject>(
  title: string,
  description: string,
  properties: PropertiesJsonSchemaLLMManual<T>,
): ObjectJsonSchemaLLMManual<T> {
  return {type: 'ObjectJsonSchemaLLMManual', title, description, properties};
}
