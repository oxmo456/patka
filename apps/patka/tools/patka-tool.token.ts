import type {InjectionToken} from 'tsyringe';
import type {JsonObject, JsonValue} from '../../../packages/json/json.ts';
import type {PatkaTool} from '../../../packages/patka-agent/tools/patka-tool.ts';

export const PATKA_TOOL: InjectionToken<PatkaTool<JsonObject, JsonValue>> = Symbol('PatkaTool');
