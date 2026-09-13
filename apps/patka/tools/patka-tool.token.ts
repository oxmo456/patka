import type {InjectionToken} from 'tsyringe';
import type {JsonObject, JsonValue} from '../json.ts';
import type {PatkaTool} from './patka-tool.ts';

export const PATKA_TOOL: InjectionToken<PatkaTool<JsonObject, JsonValue>> = Symbol('PatkaTool');
