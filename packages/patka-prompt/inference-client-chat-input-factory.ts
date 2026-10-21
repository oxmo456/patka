import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';
import type {InferenceClientChatInput} from '../patka-inference/inference-client-chat-input.ts';

export interface InferenceClientChatInputFactory {
  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): InferenceClientChatInput;
}
