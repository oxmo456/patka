import Anthropic from '@anthropic-ai/sdk';
import {Ollama} from 'ollama';
import {match} from 'ts-pattern';
import type {InferenceClient} from '../../../packages/patka-inference/inference-client.ts';
import {AnthropicInferenceClient} from '../../../packages/patka-inference-anthropic/anthropic-inference-client.ts';
import {OllamaInferenceClient} from '../../../packages/patka-inference-ollama/ollama-inference-client.ts';

const DEFAULT_OLLAMA_MODEL = 'qwen2.5-coder:latest';

const OLLAMA_MODEL_FLAG = '--ollama-model=';

const ANTHROPIC_MODEL = 'claude-opus-5';

export type PatkaInferenceClientOption = 'ollama' | 'anthropic';

export const extractInferenceClientOption = (
  args: ReadonlyArray<string>,
): PatkaInferenceClientOption =>
  match(args)
    .when(
      (candidates: ReadonlyArray<string>) => candidates.includes('--anthropic'),
      (): PatkaInferenceClientOption => 'anthropic',
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
    .with('ollama', () => new OllamaInferenceClient(ollamaModel, new Ollama()))
    .with('anthropic', () => new AnthropicInferenceClient(ANTHROPIC_MODEL, new Anthropic()))
    .exhaustive();
