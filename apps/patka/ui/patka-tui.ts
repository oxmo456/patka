import {randomUUID} from 'node:crypto';
import type blessedModule from 'blessed';
import type {Widgets} from 'blessed';
import {type Observable, ReplaySubject} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import type {PatkaChatEntry} from '../chat/patka-chat-entry.ts';
import {attempt} from '../try.ts';
import {BLESSED} from './blessed.token.ts';
import {toMarkdownLines, visibleLength} from './patka-markdown.ts';
import type {PatkaUI} from './patka-ui.ts';
import type {PatkaUserInput} from './patka-user-input.ts';
import {SOLARIZED} from './solarized.ts';

export type Blessed = Pick<typeof blessedModule, 'screen' | 'box' | 'line' | 'textbox'>;

const PENDING_RESPONSE = '...';

const USER_STYLE = `{${SOLARIZED.blue}-bg}{${SOLARIZED.base3}-fg}`;

const AGENT_STYLE = `{${SOLARIZED.base02}-bg}{${SOLARIZED.base0}-fg}`;

const CHAT_WIDTH = '50%';

const MIN_WIDTH = 8;

const LEVEL_STYLE: Record<number, string> = {
  30: `{${SOLARIZED.green}-fg}`,
  40: `{${SOLARIZED.yellow}-fg}`,
  50: `{${SOLARIZED.red}-fg}`,
};

const PINO_OWN_FIELDS: ReadonlySet<string> = new Set(['level', 'time', 'pid', 'hostname', 'msg']);

const escapeTags = (text: string): string =>
  text.replace(/[{}]/g, (brace) => (brace === '{' ? '{open}' : '{close}'));

const wrap = (text: string, width: number): ReadonlyArray<string> => {
  const lines: Array<string> = [];
  let line = '';

  for (const word of text.split(/\s+/).filter((candidate) => candidate.length > 0)) {
    for (let rest: string = word; rest.length > 0; rest = rest.slice(width)) {
      const chunk = visibleLength(rest) <= width ? rest : rest.slice(0, width);

      if (line.length === 0) {
        line = chunk;
      } else if (visibleLength(line) + 1 + visibleLength(chunk) <= width) {
        line = `${line} ${chunk}`;
      } else {
        lines.push(line);
        line = chunk;
      }

      if (chunk === rest) {
        break;
      }
    }
  }

  lines.push(line);

  return lines;
};

const toBubble = (patkaChatEntry: PatkaChatEntry, width: number): ReadonlyArray<string> => {
  const text = match(patkaChatEntry.status)
    .with('pending', () => PENDING_RESPONSE)
    .with('complete', 'failed', () => patkaChatEntry.message)
    .exhaustive();
  const bubbleWidth = Math.max(MIN_WIDTH, width - 1);
  const lines = toMarkdownLines(text).flatMap((line) => wrap(line, bubbleWidth));
  const style = match(patkaChatEntry.role)
    .with('user', () => USER_STYLE)
    .with('agent', () => AGENT_STYLE)
    .exhaustive();

  return lines.map((line) => `${style}${line}${' '.repeat(bubbleWidth - visibleLength(line))} {/}`);
};

const toDetailLines = (record: Record<string, unknown>, width: number): ReadonlyArray<string> =>
  Object.entries(record)
    .filter(([key]) => !PINO_OWN_FIELDS.has(key))
    .flatMap(([key, value]) =>
      `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`
        .split('\n')
        .flatMap((line) => wrap(line, width - 2))
        .map((line) => `  ${escapeTags(line)}`),
    );

const toInvokeLines = (record: Record<string, unknown>, width: number): ReadonlyArray<string> =>
  [`invoke ${record.name}`, ...JSON.stringify(record.input, null, 2).split('\n')]
    .flatMap((line) => line.match(new RegExp(`.{1,${width - 2}}`, 'g')) ?? [''])
    .map((line) => `  ${escapeTags(line)}`);

const toLogLines = (log: string, width: number): ReadonlyArray<string> =>
  match(
    attempt(
      () => JSON.parse(log) as Record<string, unknown> & {level: number; time: number; msg: string},
    ),
  )
    .with({type: 'success'}, ({value}) => {
      const style = LEVEL_STYLE[value.level] ?? '';
      const time = new Date(value.time).toISOString().slice(11, 19);
      const head = wrap(`${time} ${value.msg}`, width).map(
        (line) => `${style}${escapeTags(line)}{/}`,
      );

      return value.msg === 'PatkaToolCall'
        ? [...head, ...toInvokeLines(value, width)]
        : [...head, ...toDetailLines(value, width)];
    })
    .with({type: 'failure'}, () => wrap(log, width).map(escapeTags))
    .exhaustive();

@injectable()
export class PatkaTUI implements PatkaUI {
  private readonly _userInputs = new ReplaySubject<PatkaUserInput>();
  private readonly screen: Widgets.Screen;
  private readonly conversation: Widgets.BoxElement;
  private readonly logs: Widgets.BoxElement;
  private patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
  private logLines: ReadonlyArray<string> = [];

  readonly userInputs: Observable<PatkaUserInput> = this._userInputs.asObservable();

  constructor(@inject(BLESSED) blessed: Blessed) {
    this.screen = blessed.screen({smartCSR: true, title: 'patka'});
    this.conversation = blessed.box({
      top: 0,
      left: 0,
      width: CHAT_WIDTH,
      height: '100%-3',
      content: '',
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      style: {fg: SOLARIZED.base0, bg: SOLARIZED.base03},
    });
    this.logs = blessed.box({
      top: 0,
      left: `${CHAT_WIDTH}+1`,
      right: 0,
      height: '100%',
      content: '',
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      style: {
        fg: SOLARIZED.base0,
        bg: SOLARIZED.base03,
      },
    });
    const separator = blessed.line({
      orientation: 'vertical',
      top: 0,
      left: CHAT_WIDTH,
      height: '100%',
      style: {fg: SOLARIZED.base02, bg: SOLARIZED.base03},
    });
    const promptInput = blessed.textbox({
      bottom: 1,
      left: 0,
      width: CHAT_WIDTH,
      height: 1,
      inputOnFocus: true,
      style: {
        fg: SOLARIZED.base1,
        bg: SOLARIZED.base03,
      },
    });
    const lineAboveInput = blessed.line({
      orientation: 'horizontal',
      bottom: 2,
      left: 0,
      width: CHAT_WIDTH,
      style: {fg: SOLARIZED.base02, bg: SOLARIZED.base03},
    });
    const lineBelowInput = blessed.line({
      orientation: 'horizontal',
      bottom: 0,
      left: 0,
      width: CHAT_WIDTH,
      style: {fg: SOLARIZED.base02, bg: SOLARIZED.base03},
    });

    promptInput.on('submit', (prompt: string) => {
      this._userInputs.next({content: prompt, timestamp: new Date(), id: randomUUID()});
      promptInput.clearValue();
      promptInput.focus();
      this.screen.render();
    });

    this.screen.append(this.conversation);
    this.screen.append(separator);
    this.screen.append(this.logs);
    this.screen.append(promptInput);
    this.screen.append(lineAboveInput);
    this.screen.append(lineBelowInput);
    this.screen.key(['escape', 'C-c'], () => process.exit(0));
    this.screen.on('resize', () => {
      this.drawChat();
      this.drawLogs();
      this.screen.render();
    });
    promptInput.focus();
    this.screen.render();
  }

  updateChat(patkaChatEntries: ReadonlyArray<PatkaChatEntry>): void {
    this.patkaChatEntries = patkaChatEntries;
    this.drawChat();
    this.screen.render();
  }

  updateLogs(logs: ReadonlyArray<string>): void {
    this.logLines = logs;
    this.drawLogs();
    this.screen.render();
  }

  private drawChat(): void {
    const width = Math.max(MIN_WIDTH, Number(this.conversation.width));
    const lines = this.patkaChatEntries.flatMap((patkaChatEntry) => [
      ...toBubble(patkaChatEntry, width),
      '',
    ]);
    const blankLines = Math.max(0, Number(this.conversation.height) - lines.length);

    this.conversation.setContent([...new Array(blankLines).fill(''), ...lines].join('\n'));
    this.conversation.setScrollPerc(100);
  }

  private drawLogs(): void {
    const width = Math.max(MIN_WIDTH, Number(this.logs.width));
    const lines = this.logLines.flatMap((log) => toLogLines(log, width));
    const blankLines = Math.max(0, Number(this.logs.height) - lines.length);

    this.logs.setContent([...new Array(blankLines).fill(''), ...lines].join('\n'));
    this.logs.setScrollPerc(100);
  }
}
