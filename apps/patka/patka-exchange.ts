import type { UUID } from "node:crypto";
import type { Option } from "./option.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

export type PatkaExchangeStatus = "pending" | "answered" | "failed";

export type PatkaExchange = {
  readonly id: UUID;
  readonly utterance: PatkaUtterance;
  readonly status: PatkaExchangeStatus;
  readonly response: Option<PatkaUtterance>;
};
