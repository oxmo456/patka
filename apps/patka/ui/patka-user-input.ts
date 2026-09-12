import type {UUID} from 'node:crypto';
import type {PatkaUtterance} from '../patka-utterance.ts';

export type PatkaUserInput = {
  readonly content: string;
  readonly timestamp: Date;
  readonly id: UUID;
};

export const toPatkaUtterance = (patkaUserInput: PatkaUserInput): PatkaUtterance => ({
  content: patkaUserInput.content,
  timestamp: patkaUserInput.timestamp,
  id: patkaUserInput.id,
});
