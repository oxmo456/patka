import type {JsonObject} from '../json/json.ts';

export type PatkaToolLLMManualProperty = {
  readonly name: string;
  readonly schema: JsonObject;
};

export function property(name: string, schema: JsonObject): PatkaToolLLMManualProperty {
  return {name, schema};
}
