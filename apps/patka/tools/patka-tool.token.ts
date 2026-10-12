import type {InjectionToken} from 'tsyringe';
import type {PatkaTool} from '../../../packages/agent/tools/patka-tool.ts';
import type {JsonObject, JsonValue} from '../../../packages/json/json.ts';

export const PATKA_TOOL: InjectionToken<PatkaTool<JsonObject, JsonValue>> = Symbol('PatkaTool');
