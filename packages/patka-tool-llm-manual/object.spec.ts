import {describe, expect, it} from 'vitest';
import {object} from './object.ts';
import {property} from './property.ts';

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
