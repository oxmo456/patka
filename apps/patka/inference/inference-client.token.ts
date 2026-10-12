import type {InjectionToken} from 'tsyringe';
import type {InferenceClient} from '../../../packages/agent/inference/inference-client.ts';

export const INFERENCE_CLIENT: InjectionToken<InferenceClient> = Symbol('InferenceClient');
