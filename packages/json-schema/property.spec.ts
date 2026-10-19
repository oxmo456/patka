import {describe, expect, it} from 'vitest';
import {property} from './property.ts';

describe('property', () => {
  it('describes a string property', () => {
    expect(property('string', 'A name.')).toEqual({type: 'string', description: 'A name.'});
  });

  it('describes a number property', () => {
    expect(property('number', 'A size.')).toEqual({type: 'number', description: 'A size.'});
  });

  it('describes a boolean property', () => {
    expect(property('boolean', 'A flag.')).toEqual({type: 'boolean', description: 'A flag.'});
  });
});
