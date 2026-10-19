import {describe, expect, it} from 'vitest';
import {objectJsonSchemaLLMManual} from './object-json-schema-llm-manual.ts';
import {patkaToolLLMManual} from './patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from './property-json-schema-llm-manual.ts';

type FooInput = {
  readonly name: string;
};

describe('patkaToolLLMManual', () => {
  it('carries the name, the input schema and the output schema of the tool', () => {
    expect(
      patkaToolLLMManual<FooInput, string>(
        'foo',
        objectJsonSchemaLLMManual<FooInput>('foo', 'Use it for foo.', {
          name: propertyJsonSchemaLLMManual('string', 'A name.'),
        }),
        propertyJsonSchemaLLMManual('string', 'A text.'),
      ),
    ).toEqual({
      name: 'foo',
      input: {
        type: 'ObjectJsonSchemaLLMManual',
        title: 'foo',
        description: 'Use it for foo.',
        properties: {name: {value: 'string', description: 'A name.'}},
      },
      output: {value: 'string', description: 'A text.'},
    });
  });
});
