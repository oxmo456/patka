import {describe, expect, it} from 'vitest';
import {input} from './input.ts';
import {property} from './property.ts';

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
