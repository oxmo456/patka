import type {InferenceUsage} from './inference-usage.ts';

export type InferenceClientResponse = {
  readonly content: string;
  readonly usage: InferenceUsage;
};
