import {EMPTY} from 'rxjs';
import {describe, expect, it} from 'vitest';
import type {JsonObject, JsonValue} from '../json/json.ts';
import type {PatkaTool} from '../patka-tool/patka-tool.ts';
import {createInferenceToolFromPatkaTool} from './inference-tool.ts';

describe('createInferenceToolFromPatkaTool', () => {
  it('names the inference tool after the patka tool', () => {
    const patkaTool: PatkaTool<JsonObject, JsonValue> = {
      name: 'read_file',
      llmManual: {
        name: 'read_file',
        input: {
          type: 'ObjectJsonSchemaLLMManual',
          title: 'read_file',
          description: 'Use it to read a file.',
          properties: {relativePath: {value: 'string', description: 'The path.'}},
        },
        output: {value: 'string', description: 'The text of the file.'},
      },
      invoke: () => EMPTY,
    };

    expect(createInferenceToolFromPatkaTool(patkaTool).name).toBe('read_file');
  });

  it('describes when to use the tool', () => {
    const patkaTool: PatkaTool<JsonObject, JsonValue> = {
      name: 'read_file',
      llmManual: {
        name: 'read_file',
        input: {
          type: 'ObjectJsonSchemaLLMManual',
          title: 'read_file',
          description: 'Use it to read a file.',
          properties: {relativePath: {value: 'string', description: 'The path.'}},
        },
        output: {value: 'string', description: 'The text of the file.'},
      },
      invoke: () => EMPTY,
    };

    expect(createInferenceToolFromPatkaTool(patkaTool).description).toContain(
      'Use it to read a file.',
    );
  });

  it('describes the output of the tool', () => {
    const patkaTool: PatkaTool<JsonObject, JsonValue> = {
      name: 'read_file',
      llmManual: {
        name: 'read_file',
        input: {
          type: 'ObjectJsonSchemaLLMManual',
          title: 'read_file',
          description: 'Use it to read a file.',
          properties: {relativePath: {value: 'string', description: 'The path.'}},
        },
        output: {value: 'string', description: 'The text of the file.'},
      },
      invoke: () => EMPTY,
    };

    expect(createInferenceToolFromPatkaTool(patkaTool).description).toContain(
      'Output: {"type":"string","description":"The text of the file."}',
    );
  });

  it('gives the JSON schema of the input', () => {
    const patkaTool: PatkaTool<JsonObject, JsonValue> = {
      name: 'read_file',
      llmManual: {
        name: 'read_file',
        input: {
          type: 'ObjectJsonSchemaLLMManual',
          title: 'read_file',
          description: 'Use it to read a file.',
          properties: {relativePath: {value: 'string', description: 'The path.'}},
        },
        output: {value: 'string', description: 'The text of the file.'},
      },
      invoke: () => EMPTY,
    };

    expect(createInferenceToolFromPatkaTool(patkaTool).inputSchema).toMatchObject({
      type: 'object',
      required: ['relativePath'],
    });
  });
});
