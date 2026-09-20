import {type Observable, queueScheduler, ReplaySubject} from 'rxjs';
import {Lifecycle, scoped} from 'tsyringe';
import type {PatkaContextEntry} from './patka-context-entry.ts';

@scoped(Lifecycle.ContainerScoped)
export class PatkaContext {
  private readonly _entries = new ReplaySubject<PatkaContextEntry>();

  readonly entries: Observable<PatkaContextEntry> = this._entries.asObservable();

  append(patkaContextEntry: PatkaContextEntry): void {
    queueScheduler.schedule(() => this._entries.next(patkaContextEntry));
  }
}
