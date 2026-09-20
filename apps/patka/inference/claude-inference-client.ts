import {spawn} from 'node:child_process';
import {Observable, type Subscriber} from 'rxjs';
import type {InferenceClient} from './inference-client.ts';
import type {InferenceClientInput} from './inference-client-input.ts';
import type {InferenceClientResponse} from './inference-client-response.ts';

const SYSTEM_PROMPT =
  'You are a language model. Continue the conversation, answering directly from your own knowledge.';

const ARGUMENTS: ReadonlyArray<string> = [
  '--print',
  '--system-prompt',
  SYSTEM_PROMPT,
  '--restricted',
  '--disable-slash-commands',
  '--strict-mcp-config',
  '--no-session-persistence',
];

export class ClaudeInferenceClient implements InferenceClient {
  private readonly command: string;

  constructor(command: string) {
    this.command = command;
  }

  generate(inferenceClientInput: InferenceClientInput): Observable<InferenceClientResponse> {
    return new Observable((subscriber: Subscriber<InferenceClientResponse>) => {
      const claude = spawn(this.command, [...ARGUMENTS, inferenceClientInput.prompt]);
      let answer = '';

      claude.stdout.on('data', (chunk: Buffer): void => {
        answer += chunk.toString();
      });

      claude.on('error', (error: Error): void => {
        subscriber.error(error);
      });

      claude.on('close', (code: number | null): void => {
        if (code === 0) {
          subscriber.next({content: answer.trim()});
          subscriber.complete();
        } else {
          subscriber.error(new Error(`${this.command} exited with code ${code}`));
        }
      });

      return (): void => {
        claude.kill();
      };
    });
  }
}
