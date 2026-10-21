import type {InferenceMessage} from './inference-message.ts';
import type {InferenceTool} from './inference-tool.ts';

export type InferenceClientChatInput = {
  readonly system: string;
  readonly messages: ReadonlyArray<InferenceMessage>;
  readonly tools: ReadonlyArray<InferenceTool>;
};
