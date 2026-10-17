import type {Observable} from 'rxjs';
import type {InferenceClientInput} from './inference-client-input.ts';
import type {InferenceClientResponse} from './inference-client-response.ts';

export interface InferenceClient {
  generate(inferenceClientInput: InferenceClientInput): Observable<InferenceClientResponse>;
}
