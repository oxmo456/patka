import {describe, expect, it} from 'vitest';
import {
  array,
  input,
  noOutput,
  object,
  output,
  patkaToolManual,
  property,
  string,
} from './patka-tool-manual.ts';

describe('patkaToolManual', () => {
  it('gathers the name, summary, usage, input and output of a tool', () => {
    expect(
      patkaToolManual(
        'foo',
        'Does foo.',
        'Use it for foo.',
        {type: 'object', properties: {}, required: []},
        {type: 'string'},
      ),
    ).toEqual({
      name: 'foo',
      summary: 'Does foo.',
      usage: 'Use it for foo.',
      input: {type: 'object', properties: {}, required: []},
      output: {type: 'string'},
    });
  });
});

describe('property', () => {
  it('names a schema', () => {
    expect(property('relativePath', {type: 'string'})).toEqual({
      name: 'relativePath',
      schema: {type: 'string'},
    });
  });
});

describe('string', () => {
  it('describes a string', () => {
    expect(string('A name.')).toEqual({type: 'string', description: 'A name.'});
  });

  it('describes a string without a description', () => {
    expect(string()).toEqual({type: 'string'});
  });
});

describe('array', () => {
  it('describes an array of items', () => {
    expect(array('Some names.', {type: 'string'})).toEqual({
      type: 'array',
      description: 'Some names.',
      items: {type: 'string'},
    });
  });
});

describe('object', () => {
  it('describes an object that requires all its properties', () => {
    expect(
      object('A model.', property('name', {type: 'string'}), property('version', {type: 'string'})),
    ).toEqual({
      type: 'object',
      description: 'A model.',
      properties: {name: {type: 'string'}, version: {type: 'string'}},
      required: ['name', 'version'],
    });
  });
});

describe('input', () => {
  it('describes an input that requires all its properties', () => {
    expect(
      input(property('pattern', {type: 'string'}), property('relativePath', {type: 'string'})),
    ).toEqual({
      type: 'object',
      properties: {pattern: {type: 'string'}, relativePath: {type: 'string'}},
      required: ['pattern', 'relativePath'],
    });
  });

  it('describes an input without properties', () => {
    expect(input()).toEqual({type: 'object', properties: {}, required: []});
  });
});

describe('output', () => {
  it('describes a success that holds some value, or a failure', () => {
    expect(output({type: 'string'})).toEqual({
      oneOf: [
        {
          type: 'object',
          description: 'The tool worked.',
          properties: {
            type: {const: 'success'},
            value: {
              type: 'object',
              properties: {type: {const: 'some'}, value: {type: 'string'}},
              required: ['type', 'value'],
            },
          },
          required: ['type', 'value'],
        },
        {
          type: 'object',
          description: 'The tool failed.',
          properties: {
            type: {const: 'failure'},
            error: {type: 'string', description: 'Why the tool failed.'},
          },
          required: ['type', 'error'],
        },
      ],
    });
  });
});

describe('noOutput', () => {
  it('describes a success that holds no value, or a failure', () => {
    expect(noOutput('The report was sent.')).toEqual({
      oneOf: [
        {
          type: 'object',
          description: 'The report was sent.',
          properties: {
            type: {const: 'success'},
            value: {
              type: 'object',
              properties: {type: {const: 'none'}},
              required: ['type'],
            },
          },
          required: ['type', 'value'],
        },
        {
          type: 'object',
          description: 'The tool failed.',
          properties: {
            type: {const: 'failure'},
            error: {type: 'string', description: 'Why the tool failed.'},
          },
          required: ['type', 'error'],
        },
      ],
    });
  });
});
