import {describe, expect, it} from 'vitest';
import {string} from './string.ts';

describe('string', () => {
  it('describes a string', () => {
    expect(string('A name.')).toEqual({type: 'string', description: 'A name.'});
  });

  it('describes a string without a description', () => {
    expect(string()).toEqual({type: 'string'});
  });
});
