import {randomUUID} from 'node:crypto';
import {map, merge, type Observable, Subscription, scan} from 'rxjs';
import {inject, injectable} from 'tsyringe';
import {PatkaAgent} from './agent/patka-agent.ts';
import {PatkaEngine} from './chat/patka-engine.ts';
import {PatkaContext} from './context/patka-context.ts';
import type {PatkaContextEntry} from './context/patka-context-entry.ts';
import {PatkaContextLogger} from './context/patka-context-logger.ts';
import type {Disposable} from './disposable.ts';
import {PatkaLogger} from './patka-logger.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import type {PatkaUI} from './ui/patka-ui.ts';
import {toPatkaUtterance} from './ui/patka-user-input.ts';

const KEPT_LOGS = 100;

@injectable()
export class Patka implements Disposable {
  private readonly subscription = new Subscription();
  private readonly patkaContext: PatkaContext;
  private readonly patkaAgent: PatkaAgent;
  private readonly patkaContextLogger: PatkaContextLogger;
  private readonly patkaEngine: PatkaEngine;
  private readonly patkaUI: PatkaUI;
  private readonly patkaLogger: PatkaLogger;

  constructor(
    @inject(PatkaContext) patkaContext: PatkaContext,
    @inject(PatkaAgent) patkaAgent: PatkaAgent,
    @inject(PatkaContextLogger) patkaContextLogger: PatkaContextLogger,
    @inject(PatkaEngine) patkaEngine: PatkaEngine,
    @inject(PATKA_UI) patkaUI: PatkaUI,
    @inject(PatkaLogger) patkaLogger: PatkaLogger,
  ) {
    this.patkaContext = patkaContext;
    this.patkaAgent = patkaAgent;
    this.patkaContextLogger = patkaContextLogger;
    this.patkaEngine = patkaEngine;
    this.patkaUI = patkaUI;
    this.patkaLogger = patkaLogger;

    this.patkaContextLogger.start();

    this.subscription.add(
      merge(this.userEntries(), this.patkaAgent.output).subscribe((patkaContextEntry) =>
        this.patkaContext.append(patkaContextEntry),
      ),
    );
    this.subscription.add(
      this.patkaEngine.patkaChatEntries.subscribe((patkaChatEntries) =>
        this.patkaUI.updateChat(patkaChatEntries),
      ),
    );
    this.subscription.add(
      this.patkaLogger.logs
        .pipe(
          scan((logs: ReadonlyArray<string>, log: string) => [...logs, log].slice(-KEPT_LOGS), []),
        )
        .subscribe((logs) => this.patkaUI.updateLogs(logs)),
    );
  }

  dispose(): void {
    this.patkaContextLogger.dispose();
    this.patkaEngine.dispose();
    this.subscription.unsubscribe();
  }

  private userEntries(): Observable<PatkaContextEntry> {
    return this.patkaUI.userInputs.pipe(
      map(
        (patkaUserInput): PatkaContextEntry => ({
          type: 'PatkaUserUtterance',
          id: randomUUID(),
          utterance: toPatkaUtterance(patkaUserInput),
        }),
      ),
    );
  }
}
