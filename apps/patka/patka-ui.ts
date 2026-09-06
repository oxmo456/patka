import type { Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaUIPrompt } from "./patka-ui-prompt.ts";

export interface PatkaUI {
  prompts: Observable<PatkaUIPrompt>;

  updateChat(chat: ReadonlyArray<PatkaChatEntry>): void;
}
