import type {UUID} from 'node:crypto';
import type {JsonObject, JsonValue} from '../json.ts';
import type {Option} from '../option.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import type {PerformanceTimestamp, Timestamp} from '../timestamp.ts';
import type {Try} from '../try.ts';

export type PatkaUserUtterance = {
  readonly type: 'PatkaUserUtterance';
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly utterance: PatkaUtterance;
};

export type PatkaInferenceClientResponse = {
  readonly type: 'PatkaInferenceClientResponse';
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly content: string;
};

export type PatkaToolCall = {
  readonly type: 'PatkaToolCall';
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly name: string;
  readonly input: JsonObject;
};

export type PatkaToolOutput = {
  readonly type: 'PatkaToolOutput';
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly name: string;
  readonly output: Try<Option<JsonValue>>;
};

export type PatkaUserNotification = {
  readonly type: 'PatkaUserNotification';
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly content: string;
};

export type PatkaError = {
  readonly type: 'PatkaError';
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly error: unknown;
};

export type PatkaContextEntry =
  | PatkaUserUtterance
  | PatkaInferenceClientResponse
  | PatkaToolCall
  | PatkaToolOutput
  | PatkaUserNotification
  | PatkaError;
