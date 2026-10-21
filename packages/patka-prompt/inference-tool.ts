import type {JsonObject, JsonValue} from '../json/json.ts';
import type {InferenceTool} from '../patka-inference/inference-tool.ts';
import type {PatkaTool} from '../patka-tool/patka-tool.ts';
import {patkaToolLLMManualJsonSchema} from '../patka-tool-llm-manual/patka-tool-llm-manual-json-schema.ts';

export function createInferenceToolFromPatkaTool(
  patkaTool: PatkaTool<JsonObject, JsonValue>,
): InferenceTool {
  const jsonSchema = patkaToolLLMManualJsonSchema(patkaTool.llmManual);

  return {
    name: patkaTool.name,
    description: `${patkaTool.llmManual.input.description} Output: ${JSON.stringify(jsonSchema.output)}`,
    inputSchema: jsonSchema.input,
  };
}
