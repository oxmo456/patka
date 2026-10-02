import type {UUID} from 'node:crypto';
import type {PatkaRole} from '../patka-role.ts';

export type PatkaChatEntryStatus = 'pending' | 'complete' | 'failed';

export type PatkaChatEntryKind = 'utterance' | 'tool';

export type PatkaChatEntry = {
  readonly id: UUID;
  readonly role: PatkaRole;
  readonly kind: PatkaChatEntryKind;
  readonly author: string;
  readonly message: string;
  readonly status: PatkaChatEntryStatus;
};
