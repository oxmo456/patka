import {describe, expect, it} from 'vitest';
import {object} from './object.ts';
import {property} from './property.ts';

describe('object', () => {
  it('describes an object with no property', () => {
    expect(object('Empty', 'Nothing inside.', {})).toEqual({
      type: 'object',
      title: 'Empty',
      description: 'Nothing inside.',
      properties: {},
      required: [],
    });
  });

  it('describes an object with its properties, all required', () => {
    expect(
      object('Product', "A product from Acme's catalog", {
        productId: property('number', 'The identifier.'),
        name: property('string', 'The name.'),
      }),
    ).toEqual({
      type: 'object',
      title: 'Product',
      description: "A product from Acme's catalog",
      properties: {
        productId: {type: 'number', description: 'The identifier.'},
        name: {type: 'string', description: 'The name.'},
      },
      required: ['productId', 'name'],
    });
  });
});
