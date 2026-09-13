import {randomUUID} from 'node:crypto';
import type blessedModule from 'blessed';
import type {Widgets} from 'blessed';
import {type Observable, ReplaySubject} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import type {PatkaChatEntry} from '../chat/patka-chat-entry.ts';
import {attempt} from '../try.ts';
import {BLESSED} from './blessed.token.ts';
import type {PatkaUI} from './patka-ui.ts';
import type {PatkaUserInput} from './patka-user-input.ts';

export type Blessed = Pick<typeof blessedModule, 'screen' | 'box' | 'textbox'>;

const PENDING_RESPONSE = '...';

const BUBBLE_RATIO = 0.6;

const USER_STYLE = '{white-bg}{blue-fg}';

const AGENT_STYLE = '{blue-bg}{white-fg}{bold}';

const CHAT_WIDTH = '50%';

const LEVEL_STYLE: Record<number, string> = {
  30: '{green-fg}',
  40: '{yellow-fg}',
  50: '{red-fg}',
};

const PINO_OWN_FIELDS: ReadonlySet<string> = new Set(['level', 'time', 'pid', 'hostname', 'msg']);

const escapeTags = (text: string): string =>
  text.replace(/[{}]/g, (brace) => (brace === '{' ? '{open}' : '{close}'));

const wrap = (text: string, width: number): ReadonlyArray<string> => {
  const lines: Array<string> = [];
  let line = '';

  for (const word of text.split(/\s+/).filter((candidate) => candidate.length > 0)) {
    for (let rest: string = word; rest.length > 0; rest = rest.slice(width)) {
      const chunk = rest.slice(0, width);

      if (line.length === 0) {
        line = chunk;
      } else if (line.length + 1 + chunk.length <= width) {
        line = `${line} ${chunk}`;
      } else {
        lines.push(line);
        line = chunk;
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
  const lines = wrap(text, Math.max(8, Math.floor(width * BUBBLE_RATIO) - 2));
  const bubbleWidth = Math.max(...lines.map((line) => line.length));
  const style = match(patkaChatEntry.role)
    .with('user', () => USER_STYLE)
    .with('agent', () => AGENT_STYLE)
    .exhaustive();

  return lines.map((line) => `${style} ${line.padEnd(bubbleWidth)} {/}`);
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

      return [...head, ...toDetailLines(value, width)];
    })
    .with({type: 'failure'}, () => wrap(log, width).map(escapeTags))
    .exhaustive();

@injectable()
export class PatkaTUI implements PatkaUI {
  private readonly _userInputs = new ReplaySubject<PatkaUserInput>();
  private readonly screen: Widgets.Screen;
  private readonly conversation: Widgets.BoxElement;
  private readonly logs: Widgets.BoxElement;

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
      style: {fg: 'white', bg: 'blue'},
    });
    this.logs = blessed.box({
      top: 0,
      left: CHAT_WIDTH,
      right: 0,
      height: '100%',
      content: '',
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      border: 'line',
      label: ' logs ',
      style: {
        fg: 'white',
        bg: 'blue',
        border: {fg: 'white', bg: 'blue'},
        label: {fg: 'white', bg: 'blue'},
      },
    });
    const promptInput = blessed.textbox({
      bottom: 0,
      left: 0,
      width: CHAT_WIDTH,
      height: 3,
      border: 'line',
      inputOnFocus: true,
      style: {fg: 'white', bg: 'blue', border: {fg: 'white', bg: 'blue'}},
    });

    promptInput.on('submit', (prompt: string) => {
      this._userInputs.next({content: prompt, timestamp: new Date(), id: randomUUID()});
      promptInput.clearValue();
      promptInput.focus();
      this.screen.render();
    });

    this.screen.append(this.conversation);
    this.screen.append(this.logs);
    this.screen.append(promptInput);
    this.screen.key(['escape', 'C-c'], () => process.exit(0));
    promptInput.focus();
    this.screen.render();
  }

  updateChat(patkaChatEntries: ReadonlyArray<PatkaChatEntry>): void {
    const width = Number(this.conversation.width);
    const lines = patkaChatEntries.flatMap((patkaChatEntry) => [
      ...toBubble(patkaChatEntry, width),
      '',
    ]);
    const blankLines = Math.max(0, Number(this.conversation.height) - lines.length);

    this.conversation.setContent([...new Array(blankLines).fill(''), ...lines].join('\n'));
    this.conversation.setScrollPerc(100);
    this.screen.render();
  }

  updateLogs(logs: ReadonlyArray<string>): void {
    const width = Math.max(8, Number(this.logs.width) - 2);
    const lines = logs.flatMap((log) => toLogLines(log, width));
    const blankLines = Math.max(0, Number(this.logs.height) - lines.length);
    const wasAtBottom = this.logs.getScrollPerc() === 100;

    this.logs.setContent([...new Array(blankLines).fill(''), ...lines].join('\n'));

    if (wasAtBottom) {
      this.logs.setScrollPerc(100);
    }

    this.screen.render();
  }
}
