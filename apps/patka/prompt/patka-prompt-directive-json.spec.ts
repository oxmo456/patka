import {describe, expect, it} from 'vitest';
import {
  createPatkaPromptDirectiveFromJson,
  createPatkaPromptDirectiveJsonFromJsonValue,
} from './patka-prompt-directive-json.ts';
import {ToolsPromptDirective} from './tools-prompt-directive.ts';
import {WorkingDirectoryPromptDirective} from './working-directory-prompt-directive.ts';

describe('createPatkaPromptDirectiveFromJson', () => {
  it('renders the text of a text directive', () => {
    const patkaPromptDirective = createPatkaPromptDirectiveFromJson({
      type: 'text',
      name: 'brief',
      purpose: 'purpose of brief',
      text: 'Be brief.',
    });

    expect(
      patkaPromptDirective.render({workingDirectory: '/home/user', patkaToolManuals: []}),
    ).toBe('Be brief.');
  });

  it('keeps the name of a text directive', () => {
    const patkaPromptDirective = createPatkaPromptDirectiveFromJson({
      type: 'text',
      name: 'brief',
      purpose: 'purpose of brief',
      text: 'Be brief.',
    });

    expect(patkaPromptDirective.name).toBe('brief');
  });

  it('keeps the purpose of a text directive', () => {
    const patkaPromptDirective = createPatkaPromptDirectiveFromJson({
      type: 'text',
      name: 'brief',
      purpose: 'purpose of brief',
      text: 'Be brief.',
    });

    expect(patkaPromptDirective.purpose).toBe('purpose of brief');
  });

  it('gives no children to a text directive without children', () => {
    const patkaPromptDirective = createPatkaPromptDirectiveFromJson({
      type: 'text',
      name: 'brief',
      purpose: 'purpose of brief',
      text: 'Be brief.',
    });

    expect(patkaPromptDirective.children).toEqual([]);
  });

  it('creates the children of a text directive', () => {
    const patkaPromptDirective = createPatkaPromptDirectiveFromJson({
      type: 'text',
      name: 'style',
      purpose: 'purpose of style',
      text: 'Style',
      children: [{type: 'text', name: 'brief', purpose: 'purpose of brief', text: 'Be brief.'}],
    });

    expect(patkaPromptDirective.children.map((child) => child.name)).toEqual(['brief']);
  });

  it('creates a working directory directive', () => {
    const patkaPromptDirective = createPatkaPromptDirectiveFromJson({type: 'working-directory'});

    expect(patkaPromptDirective).toBeInstanceOf(WorkingDirectoryPromptDirective);
  });

  it('creates a tools directive', () => {
    const patkaPromptDirective = createPatkaPromptDirectiveFromJson({type: 'tools'});

    expect(patkaPromptDirective).toBeInstanceOf(ToolsPromptDirective);
  });
});

describe('createPatkaPromptDirectiveJsonFromJsonValue', () => {
  it('accepts a text directive', () => {
    expect(
      createPatkaPromptDirectiveJsonFromJsonValue({
        type: 'text',
        name: 'brief',
        purpose: 'purpose of brief',
        text: 'Be brief.',
      }).type,
    ).toBe('success');
  });

  it('accepts a text directive with a working directory and a tools child', () => {
    expect(
      createPatkaPromptDirectiveJsonFromJsonValue({
        type: 'text',
        name: 'environment',
        purpose: 'purpose of environment',
        text: 'Environment',
        children: [{type: 'working-directory'}, {type: 'tools'}],
      }).type,
    ).toBe('success');
  });

  it('rejects a directive of an unknown type', () => {
    expect(createPatkaPromptDirectiveJsonFromJsonValue({type: 'unknown'}).type).toBe('failure');
  });

  it('rejects a text directive without a purpose', () => {
    expect(
      createPatkaPromptDirectiveJsonFromJsonValue({type: 'text', name: 'brief', text: 'Be brief.'})
        .type,
    ).toBe('failure');
  });

  it('rejects a text directive with an unknown property', () => {
    expect(
      createPatkaPromptDirectiveJsonFromJsonValue({
        type: 'text',
        name: 'brief',
        purpose: 'purpose of brief',
        text: 'Be brief.',
        colour: 'blue',
      }).type,
    ).toBe('failure');
  });

  it('rejects a text directive with a child that is not valid', () => {
    expect(
      createPatkaPromptDirectiveJsonFromJsonValue({
        type: 'text',
        name: 'style',
        purpose: 'purpose of style',
        text: 'Style',
        children: [{type: 'text', name: 'brief'}],
      }).type,
    ).toBe('failure');
  });
});
