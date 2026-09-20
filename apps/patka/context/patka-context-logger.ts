import {Subscription} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import type {Disposable} from '../disposable.ts';
import type {JsonObject} from '../json.ts';
import {PatkaLogger} from '../patka-logger.ts';
import {PatkaContext} from './patka-context.ts';
import type {PatkaContextEntry} from './patka-context-entry.ts';

const toDetails = (patkaContextEntry: PatkaContextEntry): JsonObject =>
  match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, ({utterance}) => ({content: utterance.content}))
    .with({type: 'PatkaReply'}, ({content}) => ({content}))
    .with({type: 'PatkaToolCall'}, ({name, input}) => ({name, input}))
    .with({type: 'PatkaToolResult'}, ({name, output}) => ({name, output}))
    .exhaustive();

@injectable()
export class PatkaContextLogger implements Disposable {
  private readonly patkaContext: PatkaContext;
  private readonly patkaLogger: PatkaLogger;
  private readonly subscription = new Subscription();

  constructor(
    @inject(PatkaContext) patkaContext: PatkaContext,
    @inject(PatkaLogger) patkaLogger: PatkaLogger,
  ) {
    this.patkaContext = patkaContext;
    this.patkaLogger = patkaLogger;
  }

  start(): void {
    this.subscription.add(
      this.patkaContext.entries.subscribe((patkaContextEntry: PatkaContextEntry): void => {
        this.patkaLogger.info(patkaContextEntry.type, toDetails(patkaContextEntry));
      }),
    );
  }

  dispose(): void {
    this.subscription.unsubscribe();
  }
}
