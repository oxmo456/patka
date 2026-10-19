import {describe, expect, it} from 'vitest';
import {propertyJsonSchemaLLMManual} from './property-json-schema-llm-manual.ts';

describe('propertyJsonSchemaLLMManual', () => {
  it('describes a property with the name of its value type', () => {
    expect(propertyJsonSchemaLLMManual('number', 'The identifier.')).toEqual({
      value: 'number',
      description: 'The identifier.',
    });
  });
});
