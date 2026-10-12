import {spawn} from 'node:child_process';
import {map, Observable, type Subscriber} from 'rxjs';
import type {InferenceClient} from '../../../packages/agent/inference/inference-client.ts';
import type {InferenceClientInput} from '../../../packages/agent/inference/inference-client-input.ts';
import type {InferenceClientResponse} from '../../../packages/agent/inference/inference-client-response.ts';
import {createTextFromPatkaTextKey} from '../text/patka-text.ts';

const SYSTEM_PROMPT = createTextFromPatkaTextKey('inference.claude.systemPrompt');

const ARGUMENTS: ReadonlyArray<string> = [
  '--print',
  '--output-format',
  'json',
  '--system-prompt',
  SYSTEM_PROMPT,
  '--restricted',
  '--disable-slash-commands',
  '--strict-mcp-config',
  '--no-session-persistence',
];

type ClaudeOutput = {
  readonly result: string;
  readonly usage: {
    readonly input_tokens: number;
    readonly output_tokens: number;
  };
};

function createInferenceClientResponseFromClaudeOutput(
  claudeOutput: ClaudeOutput,
): InferenceClientResponse {
  return {
    content: claudeOutput.result.trim(),
    usage: {
      inputTokens: claudeOutput.usage.input_tokens,
      outputTokens: claudeOutput.usage.output_tokens,
    },
  };
}

export class ClaudeInferenceClient implements InferenceClient {
  private readonly command: string;

  constructor(command: string) {
    this.command = command;
  }

  generate(inferenceClientInput: InferenceClientInput): Observable<InferenceClientResponse> {
    return new Observable((subscriber: Subscriber<string>) => {
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
          subscriber.next(answer);
          subscriber.complete();
        } else {
          subscriber.error(new Error(`${this.command} exited with code ${code}`));
        }
      });

      return (): void => {
        claude.kill();
      };
    }).pipe(map((answer) => createInferenceClientResponseFromClaudeOutput(JSON.parse(answer))));
  }
}
