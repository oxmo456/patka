import type {UUID} from 'node:crypto';
import type {PatkaRole} from '../patka-role.ts';
import type {PatkaChatEntryMetadata} from './patka-chat-entry-metadata.ts';

export type PatkaChatEntryStatus = 'pending' | 'complete' | 'failed';

export type PatkaChatEntry = {
  readonly id: UUID;
  readonly role: PatkaRole;
  readonly author: string;
  readonly message: string;
  readonly status: PatkaChatEntryStatus;
  readonly metadata: PatkaChatEntryMetadata;
};
