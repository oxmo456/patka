import {describe, expect, it} from 'vitest';
import {array} from './array.ts';

describe('array', () => {
  it('describes an array of items', () => {
    expect(array('Some names.', {type: 'string'})).toEqual({
      type: 'array',
      description: 'Some names.',
      items: {type: 'string'},
    });
  });
});
