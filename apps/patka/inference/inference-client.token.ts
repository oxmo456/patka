import type {InjectionToken} from 'tsyringe';
import type {InferenceClient} from './inference-client.ts';

export const INFERENCE_CLIENT: InjectionToken<InferenceClient> = Symbol('InferenceClient');
