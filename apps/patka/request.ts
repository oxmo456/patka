import { randomUUID } from "node:crypto";

export type RequestState =
  | { kind: "submitted"; submittedAt: Date }
  | { kind: "canceled"; submittedAt: Date; canceledAt: Date }
  | { kind: "completed"; submittedAt: Date; completedAt: Date };

export interface UserRequest {
  id: string;
  prompt: string;
  state: RequestState;
}

export function submit(prompt: string, submittedAt: Date): UserRequest {
  return { id: randomUUID(), prompt, state: { kind: "submitted", submittedAt } };
}

export function cancel(request: UserRequest, canceledAt: Date): UserRequest | null {
  if (request.state.kind !== "submitted") return null;
  return {
    ...request,
    state: { kind: "canceled", submittedAt: request.state.submittedAt, canceledAt },
  };
}

export function complete(request: UserRequest, completedAt: Date): UserRequest | null {
  if (request.state.kind !== "submitted") return null;
  return {
    ...request,
    state: { kind: "completed", submittedAt: request.state.submittedAt, completedAt },
  };
}
