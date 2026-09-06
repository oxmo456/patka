import type { Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaUserInput } from "./patka-user-input.ts";

export interface PatkaUI {
  userInputs: Observable<PatkaUserInput>;

  updateChat(chat: ReadonlyArray<PatkaChatEntry>): void;
}
