import type {UUID} from 'node:crypto';
import type {Duration} from '../duration.ts';

export type PatkaContextEntryOrigin = {
  readonly parentId: UUID;
  readonly durationSinceParent: Duration;
};
