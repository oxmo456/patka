import type { Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

export interface PatkaUI {
  prompts: Observable<string>;

  updateChat(chat: ReadonlyArray<PatkaChatEntry>): void;
}
