import type {JsonObject} from '../json/json.ts';

export function array(description: string, items: JsonObject): JsonObject {
  return {type: 'array', description, items};
}
