import type {InjectionToken} from 'tsyringe';
import type {InferenceClientChatInputFactory} from '../../../packages/patka-prompt/inference-client-chat-input-factory.ts';

export const INFERENCE_CLIENT_CHAT_INPUT_FACTORY: InjectionToken<InferenceClientChatInputFactory> =
  Symbol('InferenceClientChatInputFactory');
