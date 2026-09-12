import type {Observable} from 'rxjs';
import type {PatkaMessage} from './patka-message.ts';

export interface InferenceClient {
  generate(patkaMessage: PatkaMessage): Observable<PatkaMessage>;
}
