import type {UUID} from 'node:crypto';
import type {Duration} from '../duration.ts';
import type {Option} from '../option.ts';
import type {PatkaRole} from '../patka-role.ts';

export type PatkaChatEntryStatus = 'pending' | 'complete' | 'failed';

export type PatkaChatEntry = {
  readonly id: UUID;
  readonly role: PatkaRole;
  readonly author: string;
  readonly message: string;
  readonly status: PatkaChatEntryStatus;
  readonly duration: Option<Duration>;
};
