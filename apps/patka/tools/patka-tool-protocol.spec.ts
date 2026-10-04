import {describe, expect, it} from 'vitest';
import {isSuccess} from '../try.ts';
import {PatkaToolProtocol} from './patka-tool-protocol.ts';

describe('PatkaToolProtocol', () => {
  it('documents the single line the model should reply with', () => {
    const manual = new PatkaToolProtocol().manual;

    expect(manual).toContain('single line');
    expect(manual).toContain('$$$invoke(tool_name, {"key": "value"})');
    expect(manual).toContain('$$$invoke(read_file, {"relativePath": "notes.txt"})');
  });

  it('reads back the tool and the input the model asked for', () => {
    const patkaToolInvocation = new PatkaToolProtocol().parse(
      '$$$invoke(list_files, {"path": "tools"})',
    );

    expect(isSuccess(patkaToolInvocation) && patkaToolInvocation.value).toEqual({
      name: 'list_files',
      input: {path: 'tools'},
    });
  });

  it('reads an invocation the model wrapped in other words', () => {
    const patkaToolInvocation = new PatkaToolProtocol().parse(
      'Let me look: $$$invoke(read_file, {"relativePath": "notes.txt"}) please wait',
    );

    expect(isSuccess(patkaToolInvocation) && patkaToolInvocation.value.name).toBe('read_file');
  });

  it('fails when the model just answered', () => {
    const attempted = new PatkaToolProtocol().parse('Paris');

    expect(attempted.type).toBe('failure');
    expect(isSuccess(attempted) || attempted.error.message).toContain('no tool invocation');
  });

  it('fails when the input is not valid json', () => {
    const attempted = new PatkaToolProtocol().parse('$$$invoke(read_file, {not json})');

    expect(attempted.type).toBe('failure');
  });

  it('recognises a reply that asks for a tool', () => {
    const patkaToolProtocol = new PatkaToolProtocol();

    expect(
      patkaToolProtocol.isAPatkaToolInvocation('$$$invoke(list_files, {"path": "tools"})'),
    ).toBe(true);
    expect(
      patkaToolProtocol.isAPatkaToolInvocation('Let me look: $$$invoke(read_file, {"path": "a"})'),
    ).toBe(true);
  });

  it('does not recognise a plain answer', () => {
    const patkaToolProtocol = new PatkaToolProtocol();

    expect(patkaToolProtocol.isAPatkaToolInvocation('Paris')).toBe(false);
    expect(patkaToolProtocol.isAPatkaToolInvocation('$$$invoke without an input')).toBe(false);
  });

  it('tells the model never to guess a tool input', () => {
    const manual = new PatkaToolProtocol().manual;

    expect(manual).toContain('Never invoke a tool as a guess.');
  });

  it('tells the model to ask a question when the request is not actionable', () => {
    const manual = new PatkaToolProtocol().manual;

    expect(manual).toContain('ask the user a question instead');
  });
});
