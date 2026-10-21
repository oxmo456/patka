import type {Observable} from 'rxjs';
import type {InferenceClientChatInput} from './inference-client-chat-input.ts';
import type {InferenceClientResponse} from './inference-client-response.ts';

export interface InferenceClient {
  chat(inferenceClientChatInput: InferenceClientChatInput): Observable<InferenceClientResponse>;
}
