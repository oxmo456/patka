import {describe, expect, it} from 'vitest';
import {createJSONSchema7FromPatkaToolLLMManualType} from './patka-tool-llm-manual-type.ts';

describe('createJSONSchema7FromPatkaToolLLMManualType', () => {
  it('creates a string schema', () => {
    expect(createJSONSchema7FromPatkaToolLLMManualType({type: 'PatkaToolLLMManualString'})).toEqual(
      {
        type: 'string',
      },
    );
  });

  it('creates a number schema', () => {
    expect(createJSONSchema7FromPatkaToolLLMManualType({type: 'PatkaToolLLMManualNumber'})).toEqual(
      {
        type: 'number',
      },
    );
  });

  it('creates a boolean schema', () => {
    expect(
      createJSONSchema7FromPatkaToolLLMManualType({type: 'PatkaToolLLMManualBoolean'}),
    ).toEqual({type: 'boolean'});
  });

  it('creates an array schema with its items', () => {
    expect(
      createJSONSchema7FromPatkaToolLLMManualType({
        type: 'PatkaToolLLMManualArray',
        items: {type: 'PatkaToolLLMManualString'},
      }),
    ).toEqual({type: 'array', items: {type: 'string'}});
  });

  it('creates an input object schema that requires all its properties', () => {
    expect(
      createJSONSchema7FromPatkaToolLLMManualType({
        type: 'PatkaToolInputLLMManual',
        properties: [
          {
            type: 'PatkaToolInputPropertyLLMManual',
            name: 'name',
            description: 'A name.',
            value: {type: 'PatkaToolLLMManualString'},
          },
          {
            type: 'PatkaToolInputPropertyLLMManual',
            name: 'size',
            description: 'A size.',
            value: {type: 'PatkaToolLLMManualNumber'},
          },
        ],
      }),
    ).toEqual({
      type: 'object',
      properties: {
        name: {type: 'string', description: 'A name.'},
        size: {type: 'number', description: 'A size.'},
      },
      required: ['name', 'size'],
    });
  });

  it('creates an input object schema without properties', () => {
    expect(
      createJSONSchema7FromPatkaToolLLMManualType({
        type: 'PatkaToolInputLLMManual',
        properties: [],
      }),
    ).toEqual({type: 'object', properties: {}, required: []});
  });

  it('creates the schema of the property value with the property description', () => {
    expect(
      createJSONSchema7FromPatkaToolLLMManualType({
        type: 'PatkaToolInputPropertyLLMManual',
        name: 'name',
        description: 'A name.',
        value: {type: 'PatkaToolLLMManualString'},
      }),
    ).toEqual({type: 'string', description: 'A name.'});
  });
});

describe('createJSONSchema7FromPatkaToolLLMManualType with an output', () => {
  it('creates the described schema of the happy path value', () => {
    expect(
      createJSONSchema7FromPatkaToolLLMManualType({
        type: 'PatkaToolOutputLLMManual',
        description: 'A text.',
        value: {type: 'PatkaToolLLMManualString'},
      }),
    ).toEqual({type: 'string', description: 'A text.'});
  });
});

describe('createJSONSchema7FromPatkaToolLLMManualType with no output', () => {
  it('creates a schema that holds only the description', () => {
    expect(
      createJSONSchema7FromPatkaToolLLMManualType({
        type: 'PatkaToolLLMManualNoOutput',
        description: 'The report was sent.',
      }),
    ).toEqual({description: 'The report was sent.'});
  });
});
