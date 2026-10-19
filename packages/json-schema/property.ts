import type {JsonObject, JsonValueTypeName} from '../json/json.ts';

export function property(jsonValueTypeName: JsonValueTypeName, description: string): JsonObject {
  return {type: jsonValueTypeName, description};
}
