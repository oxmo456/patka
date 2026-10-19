import {describe, expect, it} from 'vitest';
import {objectJsonSchemaLLMManual} from './object-json-schema-llm-manual.ts';
import {patkaToolLLMManual} from './patka-tool-llm-manual.ts';
import {patkaToolLLMManualJsonSchema} from './patka-tool-llm-manual-json-schema.ts';
import {propertyJsonSchemaLLMManual} from './property-json-schema-llm-manual.ts';

type FooInput = {
  readonly name: string;
};

describe('patkaToolLLMManualJsonSchema', () => {
  it('turns the manual of a tool into the JSON schemas of its input and output', () => {
    expect(
      patkaToolLLMManualJsonSchema(
        patkaToolLLMManual<FooInput, string>(
          'foo',
          objectJsonSchemaLLMManual<FooInput>('foo', 'Use it for foo.', {
            name: propertyJsonSchemaLLMManual('string', 'A name.'),
          }),
          propertyJsonSchemaLLMManual('string', 'A text.'),
        ),
      ),
    ).toEqual({
      input: {
        type: 'object',
        title: 'foo',
        description: 'Use it for foo.',
        properties: {name: {type: 'string', description: 'A name.'}},
        required: ['name'],
      },
      output: {type: 'string', description: 'A text.'},
    });
  });

  it('requires no property when the input holds none', () => {
    expect(
      patkaToolLLMManualJsonSchema(
        patkaToolLLMManual<Record<string, never>, string>(
          'bar',
          objectJsonSchemaLLMManual<Record<string, never>>('bar', 'Use it for bar.', {}),
          propertyJsonSchemaLLMManual('string', 'A text.'),
        ),
      ).input,
    ).toEqual({
      type: 'object',
      title: 'bar',
      description: 'Use it for bar.',
      properties: {},
      required: [],
    });
  });
});
