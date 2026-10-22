import {describe, expect, it} from 'vitest';
import {PatkaText} from './patka-text.ts';

describe('PatkaText', () => {
  it('gives the text of a key', () => {
    expect(new PatkaText({greeting: 'hello'}).get('greeting')).toBe('hello');
  });

  it('replaces a placeholder with its value', () => {
    expect(new PatkaText({greeting: 'hello {name}'}).get('greeting', {name: 'patka'})).toBe(
      'hello patka',
    );
  });

  it('throws when the key is missing', () => {
    expect(() => new PatkaText({}).get('greeting')).toThrow(
      'The dictionary has no text for the key: greeting',
    );
  });
});
