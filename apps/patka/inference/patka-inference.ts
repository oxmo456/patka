import Anthropic from '@anthropic-ai/sdk';
import {Ollama} from 'ollama';
import {match} from 'ts-pattern';
import {AnthropicInferenceClient} from './anthropic-inference-client.ts';
import {ClaudeInferenceClient} from './claude-inference-client.ts';
import type {InferenceClient} from './inference-client.ts';
import {OllamaInferenceClient} from './ollama-inference-client.ts';

const DEFAULT_OLLAMA_MODEL = 'qwen2.5-coder:latest';

const OLLAMA_MODEL_FLAG = '--ollama-model=';

const CLAUDE_COMMAND = 'claude';

const ANTHROPIC_MODEL = 'claude-opus-5';

export type PatkaInferenceClientOption = 'ollama' | 'claude' | 'anthropic';

export const extractInferenceClientOption = (
  args: ReadonlyArray<string>,
): PatkaInferenceClientOption =>
  match(args)
    .when(
      (candidates: ReadonlyArray<string>) => candidates.includes('--anthropic'),
      (): PatkaInferenceClientOption => 'anthropic',
    )
    .when(
      (candidates: ReadonlyArray<string>) => candidates.includes('--claude'),
      (): PatkaInferenceClientOption => 'claude',
    )
    .otherwise((): PatkaInferenceClientOption => 'ollama');

export function extractOllamaModel(args: ReadonlyArray<string>): string {
  const ollamaModelArgument = args.find((argument) => argument.startsWith(OLLAMA_MODEL_FLAG));

  return ollamaModelArgument === undefined
    ? DEFAULT_OLLAMA_MODEL
    : ollamaModelArgument.slice(OLLAMA_MODEL_FLAG.length);
}

export const buildInferenceClient = (
  patkaInferenceClientOption: PatkaInferenceClientOption,
  ollamaModel: string,
): InferenceClient =>
  match(patkaInferenceClientOption)
    .with('claude', () => new ClaudeInferenceClient(CLAUDE_COMMAND))
    .with('ollama', () => new OllamaInferenceClient(ollamaModel, new Ollama()))
    .with('anthropic', () => new AnthropicInferenceClient(ANTHROPIC_MODEL, new Anthropic()))
    .exhaustive();
