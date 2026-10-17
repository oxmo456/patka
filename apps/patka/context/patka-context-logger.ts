import type {Subscription} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import type {Disposable} from '../../../packages/disposable/disposable.ts';
import type {JsonObject} from '../../../packages/json/json.ts';
import type {PatkaContextEntry} from '../../../packages/patka-context/patka-context-entry.ts';
import {PatkaLogger} from '../../../packages/patka-logger/patka-logger.ts';
import {createJsonFromToolTry} from '../../../packages/patka-tool/patka-tool-json.ts';
import {PatkaContext} from './patka-context.ts';

const toDetails = (patkaContextEntry: PatkaContextEntry): JsonObject =>
  match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, ({utterance}) => ({content: utterance.content}))
    .with({type: 'PatkaInferenceClientResponse'}, ({content}) => ({content}))
    .with({type: 'PatkaToolCall'}, ({name, input}) => ({name, input}))
    .with({type: 'PatkaAgentUtterance'}, ({content}) => ({content}))
    .with({type: 'PatkaUserNotification'}, ({content}) => ({content}))
    .with({type: 'PatkaError'}, ({error}) => ({error: String(error)}))
    .with({type: 'PatkaToolOutput'}, ({name, output}) => ({
      name,
      output: createJsonFromToolTry(output),
    }))
    .exhaustive();

@injectable()
export class PatkaContextLogger implements Disposable {
  private readonly patkaContext: PatkaContext;
  private readonly patkaLogger: PatkaLogger;
  private logEntries: Subscription | undefined;

  constructor(
    @inject(PatkaContext) patkaContext: PatkaContext,
    @inject(PatkaLogger) patkaLogger: PatkaLogger,
  ) {
    this.patkaContext = patkaContext;
    this.patkaLogger = patkaLogger;
  }

  start(): void {
    this.logEntries = this.patkaContext.entries.subscribe(
      (patkaContextEntry: PatkaContextEntry): void => {
        this.patkaLogger.info(patkaContextEntry.type, toDetails(patkaContextEntry));
      },
    );
  }

  dispose(): void {
    this.logEntries?.unsubscribe();
  }
}
