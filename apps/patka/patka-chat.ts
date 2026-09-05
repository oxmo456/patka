import { randomUUID, type UUID } from "node:crypto";
import { BehaviorSubject, type Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

export class PatkaChat {
  private readonly _entries = new BehaviorSubject<ReadonlyArray<PatkaChatEntry>>([]);

  readonly entries: Observable<ReadonlyArray<PatkaChatEntry>> = this._entries.asObservable();

  push(message: string): UUID {
    const id = randomUUID();

    this._entries.next([...this._entries.value, { message: { message, id } }]);

    return id;
  }

  update(id: UUID, message: string): void {
    this._entries.next(
      this._entries.value.map((entry) =>
        entry.message.id === id ? { message: { message, id } } : entry,
      ),
    );
  }
}
