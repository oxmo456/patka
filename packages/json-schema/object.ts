import type {JsonObject} from '../json/json.ts';

export function object(
  title: string,
  description: string,
  properties: Readonly<Record<string, JsonObject>>,
): JsonObject {
  return {
    type: 'object',
    title,
    description,
    properties,
    required: Object.keys(properties),
  };
}
