import {describe, expect, it} from 'vitest';
import {toMarkdownLines, visibleLength} from './patka-markdown.ts';

describe('toMarkdownLines', () => {
  it('makes a heading bold', () => {
    expect(toMarkdownLines('# Title')).toEqual(['{bold}Title{/bold}']);
  });

  it('makes a double star bold', () => {
    expect(toMarkdownLines('a **bold** word')).toEqual(['a {bold}bold{/bold} word']);
  });

  it('underlines a single star, because a terminal has no italic', () => {
    expect(toMarkdownLines('an *italic* word')).toEqual(['an {underline}italic{/underline} word']);
  });

  it('colours a code span', () => {
    expect(toMarkdownLines('run `npm test` now')).toEqual([
      'run {yellow-fg}npm test{/yellow-fg} now',
    ]);
  });

  it('keeps a bullet', () => {
    expect(toMarkdownLines('* first')).toEqual(['- first']);
  });

  it('marks a quote', () => {
    expect(toMarkdownLines('> said so')).toEqual(['| said so']);
  });

  it('drops the fences of a code block', () => {
    expect(toMarkdownLines(['```ts', 'const x = 1;', '```'].join('\n'))).toEqual([
      '{yellow-fg}const x = 1;{/yellow-fg}',
    ]);
  });

  it('leaves a star inside a code block alone', () => {
    expect(toMarkdownLines(['```', 'a * b', '```'].join('\n'))).toEqual([
      '{yellow-fg}a * b{/yellow-fg}',
    ]);
  });

  it('gives one line per line of the answer', () => {
    expect(toMarkdownLines(['first', 'second'].join('\n'))).toEqual(['first', 'second']);
  });
});

describe('visibleLength', () => {
  it('counts plain text as it is', () => {
    expect(visibleLength('hello')).toBe(5);
  });

  it('does not count a blessed tag', () => {
    expect(visibleLength('{bold}hello{/bold}')).toBe(5);
  });

  it('counts an escaped brace as the one character it draws', () => {
    expect(visibleLength('{open}a{close}')).toBe(3);
  });
});
