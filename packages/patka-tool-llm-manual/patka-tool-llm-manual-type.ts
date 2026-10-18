import type {JSONSchema7} from 'json-schema';
import {match} from 'ts-pattern';

export type PatkaToolLLMManualString = {
  readonly type: 'PatkaToolLLMManualString';
};

export type PatkaToolLLMManualNumber = {
  readonly type: 'PatkaToolLLMManualNumber';
};

export type PatkaToolLLMManualBoolean = {
  readonly type: 'PatkaToolLLMManualBoolean';
};

export type PatkaToolLLMManualScalar =
  | PatkaToolLLMManualString
  | PatkaToolLLMManualNumber
  | PatkaToolLLMManualBoolean;

export type PatkaToolLLMManualArray = {
  readonly type: 'PatkaToolLLMManualArray';
  readonly items: PatkaToolLLMManualScalar;
};

export type PatkaToolLLMManualValue = PatkaToolLLMManualScalar | PatkaToolLLMManualArray;

export type PatkaToolInputPropertyLLMManual = {
  readonly type: 'PatkaToolInputPropertyLLMManual';
  readonly name: string;
  readonly description: string;
  readonly value: PatkaToolLLMManualValue;
};

export type PatkaToolInputLLMManual = {
  readonly type: 'PatkaToolInputLLMManual';
  readonly properties: ReadonlyArray<PatkaToolInputPropertyLLMManual>;
};

export type PatkaToolOutputLLMManual = {
  readonly type: 'PatkaToolOutputLLMManual';
  readonly description: string;
  readonly value: PatkaToolLLMManualValue;
};

export type PatkaToolLLMManualNoOutput = {
  readonly type: 'PatkaToolLLMManualNoOutput';
  readonly description: string;
};

export type PatkaToolLLMManualType =
  | PatkaToolLLMManualValue
  | PatkaToolInputPropertyLLMManual
  | PatkaToolInputLLMManual
  | PatkaToolOutputLLMManual
  | PatkaToolLLMManualNoOutput;

export function createJSONSchema7FromPatkaToolLLMManualType(
  patkaToolLLMManualType: PatkaToolLLMManualType,
): JSONSchema7 {
  return match(patkaToolLLMManualType)
    .returnType<JSONSchema7>()
    .with({type: 'PatkaToolLLMManualString'}, () => ({type: 'string'}))
    .with({type: 'PatkaToolLLMManualNumber'}, () => ({type: 'number'}))
    .with({type: 'PatkaToolLLMManualBoolean'}, () => ({type: 'boolean'}))
    .with({type: 'PatkaToolLLMManualArray'}, (patkaToolLLMManualArray) => ({
      type: 'array',
      items: createJSONSchema7FromPatkaToolLLMManualType(patkaToolLLMManualArray.items),
    }))
    .with({type: 'PatkaToolInputPropertyLLMManual'}, (patkaToolInputPropertyLLMManual) => ({
      ...createJSONSchema7FromPatkaToolLLMManualType(patkaToolInputPropertyLLMManual.value),
      description: patkaToolInputPropertyLLMManual.description,
    }))
    .with({type: 'PatkaToolInputLLMManual'}, (patkaToolInputLLMManual) => ({
      type: 'object',
      properties: Object.fromEntries(
        patkaToolInputLLMManual.properties.map(
          (patkaToolInputPropertyLLMManual: PatkaToolInputPropertyLLMManual) => [
            patkaToolInputPropertyLLMManual.name,
            createJSONSchema7FromPatkaToolLLMManualType(patkaToolInputPropertyLLMManual),
          ],
        ),
      ),
      required: patkaToolInputLLMManual.properties.map(
        (patkaToolInputPropertyLLMManual: PatkaToolInputPropertyLLMManual) =>
          patkaToolInputPropertyLLMManual.name,
      ),
    }))
    .with({type: 'PatkaToolOutputLLMManual'}, (patkaToolOutputLLMManual) => ({
      ...createJSONSchema7FromPatkaToolLLMManualType(patkaToolOutputLLMManual.value),
      description: patkaToolOutputLLMManual.description,
    }))
    .with({type: 'PatkaToolLLMManualNoOutput'}, (patkaToolLLMManualNoOutput) => ({
      description: patkaToolLLMManualNoOutput.description,
    }))
    .exhaustive();
}
