import type {UUID} from 'node:crypto';
import type {JsonObject, JsonValue} from '../json.ts';
import type {Option} from '../option.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';

export type PatkaUserUtterance = {
  readonly type: 'PatkaUserUtterance';
  readonly id: UUID;
  readonly utterance: PatkaUtterance;
};

export type PatkaInferenceClientResponse = {
  readonly type: 'PatkaInferenceClientResponse';
  readonly id: UUID;
  readonly content: string;
};

export type PatkaToolCall = {
  readonly type: 'PatkaToolCall';
  readonly id: UUID;
  readonly name: string;
  readonly input: JsonObject;
};

export type PatkaToolResult = {
  readonly type: 'PatkaToolResult';
  readonly id: UUID;
  readonly name: string;
  readonly output: Option<JsonValue>;
};

export type PatkaUserNotification = {
  readonly type: 'PatkaUserNotification';
  readonly id: UUID;
  readonly content: string;
};

export type PatkaContextEntry =
  | PatkaUserUtterance
  | PatkaInferenceClientResponse
  | PatkaToolCall
  | PatkaToolResult
  | PatkaUserNotification;
