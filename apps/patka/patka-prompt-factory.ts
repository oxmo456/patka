import type { PatkaHistoryNode } from "./patka-history-node.ts";

export interface PatkaPromptFactory {
  create(history: ReadonlyArray<PatkaHistoryNode>): string;
}
