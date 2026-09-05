import type blessedModule from "blessed";
import type { Widgets } from "blessed";
import { ReplaySubject, type Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaUI } from "./patka-ui.ts";

export type Blessed = Pick<typeof blessedModule, "screen" | "box" | "textbox">;

export class PatkaTUI implements PatkaUI {
  private readonly _prompts = new ReplaySubject<string>();
  private readonly screen: Widgets.Screen;
  private readonly conversation: Widgets.BoxElement;

  readonly prompts: Observable<string> = this._prompts.asObservable();

  constructor(blessed: Blessed) {
    this.screen = blessed.screen({ smartCSR: true, title: "patka" });
    this.conversation = blessed.box({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%-3",
      content: "",
      scrollable: true,
      alwaysScroll: true,
    });
    const promptInput = blessed.textbox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      border: "line",
      inputOnFocus: true,
    });

    promptInput.on("submit", (prompt: string) => {
      this._prompts.next(prompt);
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
    const lines = chat.map((entry) => entry.message.message);
    const blankLines = Math.max(0, Number(this.conversation.height) - lines.length);

    this.conversation.setContent([...new Array(blankLines).fill(""), ...lines].join("\n"));
    this.conversation.setScrollPerc(100);
    this.screen.render();
  }
}
