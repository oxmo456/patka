import type {Option} from '../option/option.ts';
import type {InferenceToolCall} from './inference-tool-call.ts';

export type InferenceToolUse = InferenceToolCall & {
  readonly id: string;
};

export type InferenceUserMessage = {
  readonly role: 'user';
  readonly content: string;
};

export type InferenceAssistantMessage = {
  readonly role: 'assistant';
  readonly content: string;
  readonly toolUse: Option<InferenceToolUse>;
};

export type InferenceToolMessage = {
  readonly role: 'tool';
  readonly toolUseId: string;
  readonly name: string;
  readonly content: string;
  readonly isError: boolean;
};

export type InferenceMessage =
  | InferenceUserMessage
  | InferenceAssistantMessage
  | InferenceToolMessage;
