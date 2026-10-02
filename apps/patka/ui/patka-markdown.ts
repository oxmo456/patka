import {SOLARIZED} from './solarized.ts';

const HEADING = /^\s{0,3}(#{1,6})\s+(.*)$/;

const BULLET = /^(\s*)[-*+]\s+(.*)$/;

const QUOTE = /^\s{0,3}>\s?(.*)$/;

const FENCE = /^\s*```/;

const CODE_SPAN = /`([^`]+)`/g;

const BOLD = /\*\*([^*]+)\*\*/g;

const ITALIC = /(?<![*\w])[*_]([^*_]+)[*_](?![*\w])/g;

const BLESSED_TAG = /\{[^{}]*\}/g;

const ESCAPED_BRACE = 'x';

const CODE_STYLE = `{${SOLARIZED.cyan}-fg}`;

const CODE_STYLE_END = `{/${SOLARIZED.cyan}-fg}`;

type MarkdownState = {
  readonly fenced: boolean;
  readonly lines: ReadonlyArray<string>;
};

export const visibleLength = (text: string): number =>
  text
    .replaceAll('{open}', ESCAPED_BRACE)
    .replaceAll('{close}', ESCAPED_BRACE)
    .replace(BLESSED_TAG, '').length;

const inline = (text: string): string =>
  text
    .replace(CODE_SPAN, `${CODE_STYLE}$1${CODE_STYLE_END}`)
    .replace(BOLD, '{bold}$1{/bold}')
    .replace(ITALIC, '{underline}$1{/underline}');

const nextState = (state: MarkdownState, line: string): MarkdownState => {
  if (FENCE.test(line)) {
    return {fenced: !state.fenced, lines: state.lines};
  }

  if (state.fenced) {
    return {fenced: true, lines: [...state.lines, `${CODE_STYLE}${line}${CODE_STYLE_END}`]};
  }

  const heading = HEADING.exec(line);

  if (heading !== null) {
    return {fenced: false, lines: [...state.lines, `{bold}${inline(heading[2])}{/bold}`]};
  }

  const quote = QUOTE.exec(line);

  if (quote !== null) {
    return {fenced: false, lines: [...state.lines, `| ${inline(quote[1])}`]};
  }

  const bullet = BULLET.exec(line);

  if (bullet !== null) {
    return {fenced: false, lines: [...state.lines, `${bullet[1]}- ${inline(bullet[2])}`]};
  }

  return {fenced: false, lines: [...state.lines, inline(line)]};
};

export const toMarkdownLines = (markdown: string): ReadonlyArray<string> =>
  markdown.split('\n').reduce(nextState, {fenced: false, lines: []} as MarkdownState).lines;
