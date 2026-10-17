import {describe, expect, it} from 'vitest';
import {property} from './property.ts';

describe('property', () => {
  it('names a schema', () => {
    expect(property('relativePath', {type: 'string'})).toEqual({
      name: 'relativePath',
      schema: {type: 'string'},
    });
  });
});
