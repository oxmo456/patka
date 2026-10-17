import type {JsonObject, JsonValue} from '../../json/json.ts';
import type {Option} from '../../option/option.ts';
import type {PatkaUtterance} from '../../patka-utterance/patka-utterance.ts';
import type {PerformanceTimestamp} from '../../performance-timestamp/performance-timestamp.ts';
import type {Timestamp} from '../../timestamp/timestamp.ts';
import type {Try} from '../../try/try.ts';
import type {InferenceUsage} from '../inference/inference-usage.ts';
import type {PatkaContextEntryID} from './patka-context-entry-id.ts';

export type PatkaUserUtterance = {
  readonly type: 'PatkaUserUtterance';
  readonly id: PatkaContextEntryID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly root: Option<PatkaContextEntryID>;
  readonly parent: Option<PatkaContextEntryID>;
  readonly utterance: PatkaUtterance;
};

export type PatkaInferenceClientResponse = {
  readonly type: 'PatkaInferenceClientResponse';
  readonly id: PatkaContextEntryID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly root: Option<PatkaContextEntryID>;
  readonly parent: Option<PatkaContextEntryID>;
  readonly content: string;
  readonly usage: InferenceUsage;
};

export type PatkaToolCall = {
  readonly type: 'PatkaToolCall';
  readonly id: PatkaContextEntryID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly root: Option<PatkaContextEntryID>;
  readonly parent: Option<PatkaContextEntryID>;
  readonly name: string;
  readonly input: JsonObject;
};

export type PatkaToolOutput = {
  readonly type: 'PatkaToolOutput';
  readonly id: PatkaContextEntryID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly root: Option<PatkaContextEntryID>;
  readonly parent: Option<PatkaContextEntryID>;
  readonly name: string;
  readonly output: Try<Option<JsonValue>>;
};

export type PatkaAgentUtterance = {
  readonly type: 'PatkaAgentUtterance';
  readonly id: PatkaContextEntryID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly root: Option<PatkaContextEntryID>;
  readonly parent: Option<PatkaContextEntryID>;
  readonly content: string;
};

export type PatkaUserNotification = {
  readonly type: 'PatkaUserNotification';
  readonly id: PatkaContextEntryID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly root: Option<PatkaContextEntryID>;
  readonly parent: Option<PatkaContextEntryID>;
  readonly content: string;
};

export type PatkaError = {
  readonly type: 'PatkaError';
  readonly id: PatkaContextEntryID;
  readonly timestamp: Timestamp;
  readonly performanceTimestamp: PerformanceTimestamp;
  readonly root: Option<PatkaContextEntryID>;
  readonly parent: Option<PatkaContextEntryID>;
  readonly error: unknown;
};

export type PatkaContextEntry =
  | PatkaUserUtterance
  | PatkaInferenceClientResponse
  | PatkaToolCall
  | PatkaToolOutput
  | PatkaAgentUtterance
  | PatkaUserNotification
  | PatkaError;
