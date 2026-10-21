import type {Option} from '../option/option.ts';
import type {InferenceToolCall} from './inference-tool-call.ts';
import type {InferenceUsage} from './inference-usage.ts';

export type InferenceClientResponse = {
  readonly content: string;
  readonly toolCall: Option<InferenceToolCall>;
  readonly usage: InferenceUsage;
};
