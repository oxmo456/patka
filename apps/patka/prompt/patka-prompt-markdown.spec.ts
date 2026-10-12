import {describe, expect, it} from 'vitest';
import {DefaultPatkaPromptDirective} from './default-patka-prompt-directive.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import {createMarkdownFromPatkaPromptDirective} from './patka-prompt-markdown.ts';

describe('createMarkdownFromPatkaPromptDirective', () => {
  it('renders a directive without children as its text', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'brief',
      'purpose of brief',
      'Be brief.',
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe('Be brief.');
  });

  it('renders a directive with children as a heading followed by its children', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'style',
      'purpose of style',
      'Style',
      [new DefaultPatkaPromptDirective('brief', 'purpose of brief', 'Be brief.')],
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe(
      `# Style

Be brief.`,
    );
  });

  it('deepens the heading at each level of the tree', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'answer',
      'purpose of answer',
      'Answer',
      [
        new DefaultPatkaPromptDirective('style', 'purpose of style', 'Style', [
          new DefaultPatkaPromptDirective('brief', 'purpose of brief', 'Be brief.'),
        ]),
      ],
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe(
      `# Answer

## Style

Be brief.`,
    );
  });

  it('separates sibling directives with a blank line', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'style',
      'purpose of style',
      'Style',
      [
        new DefaultPatkaPromptDirective('brief', 'purpose of brief', 'Be brief.'),
        new DefaultPatkaPromptDirective('markdown', 'purpose of markdown', 'Use markdown.'),
      ],
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe(
      `# Style

Be brief.

Use markdown.`,
    );
  });

  it('skips a child that renders nothing', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'style',
      'purpose of style',
      'Style',
      [
        new DefaultPatkaPromptDirective('empty', 'purpose of empty', ''),
        new DefaultPatkaPromptDirective('brief', 'purpose of brief', 'Be brief.'),
      ],
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe(
      `# Style

Be brief.`,
    );
  });

  it('skips the heading of a directive whose children all render nothing', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'style',
      'purpose of style',
      'Style',
      [new DefaultPatkaPromptDirective('empty', 'purpose of empty', '')],
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe('');
  });

  it('does not deepen the heading of children under a directive with no text', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'root',
      'purpose of root',
      '',
      [
        new DefaultPatkaPromptDirective('style', 'purpose of style', 'Style', [
          new DefaultPatkaPromptDirective('brief', 'purpose of brief', 'Be brief.'),
        ]),
      ],
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe(
      `# Style

Be brief.`,
    );
  });

  it('renders no heading for a directive with no text', () => {
    const patkaPromptDirective: PatkaPromptDirective<unknown> = new DefaultPatkaPromptDirective(
      'root',
      'purpose of root',
      '',
      [new DefaultPatkaPromptDirective('brief', 'purpose of brief', 'Be brief.')],
    );

    expect(createMarkdownFromPatkaPromptDirective(patkaPromptDirective, {})).toBe('Be brief.');
  });
});
