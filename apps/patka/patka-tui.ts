import { randomUUID } from "node:crypto";
import type blessedModule from "blessed";
import type { Widgets } from "blessed";
import { type Observable, ReplaySubject } from "rxjs";
import { match } from "ts-pattern";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaUI } from "./patka-ui.ts";
import type { PatkaUserInput } from "./patka-user-input.ts";

export type Blessed = Pick<typeof blessedModule, "screen" | "box" | "textbox">;

const PENDING_RESPONSE = "...";

const BUBBLE_RATIO = 0.6;

const USER_STYLE = "{white-bg}{blue-fg}";

const AGENT_STYLE = "{blue-bg}{white-fg}{bold}";

const wrap = (text: string, width: number): ReadonlyArray<string> => {
  const lines: Array<string> = [];
  let line = "";

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

const toBubble = (entry: PatkaChatEntry, width: number): ReadonlyArray<string> => {
  const text = match(entry.status)
    .with("pending", () => PENDING_RESPONSE)
    .with("complete", "failed", () => entry.message)
    .exhaustive();
  const lines = wrap(text, Math.max(8, Math.floor(width * BUBBLE_RATIO) - 2));
  const bubbleWidth = Math.max(...lines.map((line) => line.length));
  const style = match(entry.role)
    .with("user", () => USER_STYLE)
    .with("agent", () => AGENT_STYLE)
    .exhaustive();

  return lines.map((line) => `${style} ${line.padEnd(bubbleWidth)} {/}`);
};

export class PatkaTUI implements PatkaUI {
  private readonly _userInputs = new ReplaySubject<PatkaUserInput>();
  private readonly screen: Widgets.Screen;
  private readonly conversation: Widgets.BoxElement;

  readonly userInputs: Observable<PatkaUserInput> = this._userInputs.asObservable();

  constructor(blessed: Blessed) {
    this.screen = blessed.screen({ smartCSR: true, title: "patka" });
    this.conversation = blessed.box({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%-3",
      content: "",
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      style: { fg: "white", bg: "blue" },
    });
    const promptInput = blessed.textbox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      border: "line",
      inputOnFocus: true,
      style: { fg: "white", bg: "blue", border: { fg: "white", bg: "blue" } },
    });

    promptInput.on("submit", (prompt: string) => {
      this._userInputs.next({ content: prompt, timestamp: new Date(), id: randomUUID() });
      promptInput.clearValue();
      promptInput.focus();
      this.screen.render();
    });

    this.screen.append(this.conversation);
    this.screen.append(promptInput);
    this.screen.key(["escape", "C-c"], () => process.exit(0));
    promptInput.focus();
    this.screen.render();
  }

  updateChat(chat: ReadonlyArray<PatkaChatEntry>): void {
    const width = Number(this.conversation.width);
    const lines = chat.flatMap((entry) => [...toBubble(entry, width), ""]);
    const blankLines = Math.max(0, Number(this.conversation.height) - lines.length);

    this.conversation.setContent([...new Array(blankLines).fill(""), ...lines].join("\n"));
    this.conversation.setScrollPerc(100);
    this.screen.render();
  }
}
