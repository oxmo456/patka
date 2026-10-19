import type {JsonValueTypeName} from '../json/json.ts';

export type PropertyJsonSchemaLLMManual<TypeName extends JsonValueTypeName> = {
  readonly value: TypeName;
  readonly description: string;
};

export function propertyJsonSchemaLLMManual<TypeName extends JsonValueTypeName>(
  value: TypeName,
  description: string,
): PropertyJsonSchemaLLMManual<TypeName> {
  return {value, description};
}
