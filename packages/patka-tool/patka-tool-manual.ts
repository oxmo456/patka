import type {JsonObject, JsonObjectSchema, JsonSchema} from '../../json/json.ts';

export type PatkaToolManual = {
  readonly name: string;
  readonly summary: string;
  readonly usage: string;
  readonly input: JsonObjectSchema;
  readonly output: JsonSchema;
};

const FAILURE_OUTPUT: JsonSchema = {
  type: 'object',
  description: 'The tool failed.',
  properties: {
    type: {const: 'failure'},
    error: {type: 'string', description: 'Why the tool failed.'},
  },
  required: ['type', 'error'],
};

export type PatkaToolManualProperty = {
  readonly name: string;
  readonly schema: JsonObject;
};

function createJsonObjectFromPatkaToolManualProperties(
  patkaToolManualProperties: ReadonlyArray<PatkaToolManualProperty>,
): JsonObject {
  return Object.fromEntries(
    patkaToolManualProperties.map((patkaToolManualProperty: PatkaToolManualProperty) => [
      patkaToolManualProperty.name,
      patkaToolManualProperty.schema,
    ]),
  );
}

export function property(name: string, schema: JsonObject): PatkaToolManualProperty {
  return {name, schema};
}

export function string(description?: string): JsonObject {
  return description === undefined ? {type: 'string'} : {type: 'string', description};
}

export function array(description: string, items: JsonObject): JsonObject {
  return {type: 'array', description, items};
}

export function object(
  description: string,
  ...patkaToolManualProperties: ReadonlyArray<PatkaToolManualProperty>
): JsonObject {
  return {
    type: 'object',
    description,
    properties: createJsonObjectFromPatkaToolManualProperties(patkaToolManualProperties),
    required: patkaToolManualProperties.map(
      (patkaToolManualProperty: PatkaToolManualProperty) => patkaToolManualProperty.name,
    ),
  };
}

export function input(
  ...patkaToolManualProperties: ReadonlyArray<PatkaToolManualProperty>
): JsonObjectSchema {
  return {
    type: 'object',
    properties: createJsonObjectFromPatkaToolManualProperties(patkaToolManualProperties),
    required: patkaToolManualProperties.map(
      (patkaToolManualProperty: PatkaToolManualProperty) => patkaToolManualProperty.name,
    ),
  };
}

export function output(value: JsonObject): JsonSchema {
  return {
    oneOf: [
      {
        type: 'object',
        description: 'The tool worked.',
        properties: {
          type: {const: 'success'},
          value: {
            type: 'object',
            properties: {type: {const: 'some'}, value},
            required: ['type', 'value'],
          },
        },
        required: ['type', 'value'],
      },
      FAILURE_OUTPUT,
    ],
  };
}

export function noOutput(description: string): JsonSchema {
  return {
    oneOf: [
      {
        type: 'object',
        description,
        properties: {
          type: {const: 'success'},
          value: {
            type: 'object',
            properties: {type: {const: 'none'}},
            required: ['type'],
          },
        },
        required: ['type', 'value'],
      },
      FAILURE_OUTPUT,
    ],
  };
}

export function patkaToolManual(
  name: string,
  summary: string,
  usage: string,
  jsonObjectSchema: JsonObjectSchema,
  jsonSchema: JsonSchema,
): PatkaToolManual {
  return {name, summary, usage, input: jsonObjectSchema, output: jsonSchema};
}
