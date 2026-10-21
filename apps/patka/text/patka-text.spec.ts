import {describe, expect, it} from 'vitest';
import {createTextFromPatkaTextKey} from './patka-text.ts';

describe('createTextFromPatkaTextKey', () => {
  it('gives the text of a key', () => {
    expect(createTextFromPatkaTextKey('agent.missingTools')).toBe(
      'Patka agent is not providing the necessary tools for the LLM to complete the task.',
    );
  });

  it('replaces a placeholder with its value', () => {
    expect(createTextFromPatkaTextKey('agent.error', {message: 'file not found'})).toBe(
      'Oops something went wrong... file not found',
    );
  });

  it('keeps a placeholder that has no value', () => {
    expect(createTextFromPatkaTextKey('agent.error')).toBe(
      'Oops something went wrong... {message}',
    );
  });

  it('keeps the dollar signs of a value', () => {
    expect(createTextFromPatkaTextKey('agent.error', {message: '$$ and $&'})).toBe(
      'Oops something went wrong... $$ and $&',
    );
  });
});

describe('the system prompt', () => {
  it('tells the model to keep its answer short', () => {
    expect(createTextFromPatkaTextKey('prompt.system')).toContain('fewest words possible');
  });

  it('tells the model to answer directly when no tool is necessary', () => {
    expect(createTextFromPatkaTextKey('prompt.system')).toContain(
      'If no tool is necessary, answer the user directly.',
    );
  });

  it('tells the model never to guess a tool input', () => {
    expect(createTextFromPatkaTextKey('prompt.system')).toContain('Never call a tool as a guess.');
  });

  it('tells the model to ask a question when the request is not actionable', () => {
    expect(createTextFromPatkaTextKey('prompt.system')).toContain(
      'ask the user a question instead',
    );
  });

  it('tells the model the directory where Patka runs', () => {
    expect(createTextFromPatkaTextKey('prompt.system', {workingDirectory: '/home/user'})).toContain(
      'As an agent, your working directory is: /home/user',
    );
  });
});
