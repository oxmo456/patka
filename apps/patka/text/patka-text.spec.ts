import {describe, expect, it} from 'vitest';
import {createTextFromPatkaTextKey} from './patka-text.ts';

describe('createTextFromPatkaTextKey', () => {
  it('gives the text of a key', () => {
    expect(createTextFromPatkaTextKey('prompt.role')).toBe('Role');
  });

  it('replaces a placeholder with its value', () => {
    expect(
      createTextFromPatkaTextKey('prompt.environment.workingDirectory', {
        workingDirectory: '/home/user',
      }),
    ).toBe('As an agent, your working directory is: /home/user');
  });

  it('keeps a placeholder that has no value', () => {
    expect(createTextFromPatkaTextKey('prompt.environment.workingDirectory')).toBe(
      'As an agent, your working directory is: {workingDirectory}',
    );
  });

  it('keeps the dollar signs of a value', () => {
    expect(createTextFromPatkaTextKey('agent.error', {message: '$$ and $&'})).toBe(
      'Oops something went wrong... $$ and $&',
    );
  });

  it('keeps the braces of a text that are not a placeholder', () => {
    expect(createTextFromPatkaTextKey('prompt.tools.protocol.format')).toBe(
      '$$$invoke(tool_name, {"key": "value"})',
    );
  });
});
