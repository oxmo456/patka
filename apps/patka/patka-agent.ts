import { Observable, Subject } from "rxjs";
import type { PatkaMessage } from "./patka-message.ts";

export class PatkaAgent {
  private readonly responsesSubject = new Subject<PatkaMessage>();

  readonly responses: Observable<PatkaMessage> = this.responsesSubject.asObservable();

  send(message: string): void {}
}
