import { EventEmitter } from "node:events";

import { cancel, complete, submit, type UserRequest } from "./request.ts";

export type RequestEvent =
  | { kind: "submitted"; request: UserRequest }
  | { kind: "canceled"; request: UserRequest }
  | { kind: "completed"; request: UserRequest };

export class RequestService {
  #requests = new Map<string, UserRequest>();
  #events = new EventEmitter();

  createRequest(prompt: string): UserRequest {
    const request = submit(prompt, new Date());
    this.#requests.set(request.id, request);
    this.#emit({ kind: "submitted", request });
    return request;
  }

  cancelRequest(id: string): UserRequest | null {
    return this.#transition(id, cancel, "canceled");
  }

  completeRequest(id: string): UserRequest | null {
    return this.#transition(id, complete, "completed");
  }

  subscribe(listener: (event: RequestEvent) => void): void {
    this.#events.on("request", listener);
  }

  get(id: string): UserRequest | null {
    return this.#requests.get(id) ?? null;
  }

  #transition(
    id: string,
    apply: (request: UserRequest, at: Date) => UserRequest | null,
    kind: "canceled" | "completed",
  ): UserRequest | null {
    const request = this.#requests.get(id);
    if (!request) return null;
    const updated = apply(request, new Date());
    if (!updated) return null;
    this.#requests.set(id, updated);
    this.#emit({ kind, request: updated });
    return updated;
  }

  #emit(event: RequestEvent): void {
    this.#events.emit("request", event);
  }
}
