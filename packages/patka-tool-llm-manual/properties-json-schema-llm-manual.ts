import type {JsonObject} from '../json/json.ts';
import type {JsonValueTypeNameOf} from './json-value-type-name-of.ts';
import type {PropertyJsonSchemaLLMManual} from './property-json-schema-llm-manual.ts';

export type PropertiesJsonSchemaLLMManual<T extends JsonObject> = {
  readonly [Key in keyof T]-?: PropertyJsonSchemaLLMManual<JsonValueTypeNameOf<T[Key]>>;
};
