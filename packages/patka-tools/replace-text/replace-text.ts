import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {defer, type Observable} from 'rxjs';
import type {PatkaText} from '../../patka-text/patka-text.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../relative-path/assert-relative-path-inside-the-working-directory.ts';

export type ReplaceTextInput = {
  readonly relativePath: string;
  readonly oldText: string;
  readonly newText: string;
};

function countOccurrences(content: string, text: string): number {
  return content.split(text).length - 1;
}

export class ReplaceText implements PatkaTool<ReplaceTextInput, string> {
  readonly name: string = 'replace_text';
  readonly llmManual: PatkaToolLLMManual<ReplaceTextInput, string>;

  private readonly workingDirectory: string;

  constructor(workingDirectory: string, patkaText: PatkaText) {
    this.workingDirectory = workingDirectory;
    this.llmManual = patkaToolLLMManual<ReplaceTextInput, string>(
      this.name,
      objectJsonSchemaLLMManual<ReplaceTextInput>(
        this.name,
        patkaText.get('tool.replace_text.description'),
        {
          relativePath: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.replace_text.input.relativePath'),
          ),
          oldText: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.replace_text.input.oldText'),
          ),
          newText: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.replace_text.input.newText'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('string', patkaText.get('tool.replace_text.output')),
    );
  }

  invoke(replaceTextInput: ReplaceTextInput): Observable<string> {
    return defer(async () => {
      assertRelativePathInsideTheWorkingDirectory(
        this.workingDirectory,
        replaceTextInput.relativePath,
      );

      if (replaceTextInput.oldText === '') {
        throw new Error('oldText is empty. Copy the exact text to replace from the file.');
      }

      const path = join(this.workingDirectory, replaceTextInput.relativePath);
      const content = await readFile(path, 'utf8');
      const occurrences = countOccurrences(content, replaceTextInput.oldText);

      if (occurrences === 0) {
        throw new Error(
          `oldText was not found in ${replaceTextInput.relativePath}. Read the file again and copy the text exactly.`,
        );
      }

      if (occurrences > 1) {
        throw new Error(
          `oldText occurs ${occurrences} times in ${replaceTextInput.relativePath}. Add surrounding lines so it occurs only once.`,
        );
      }

      await writeFile(
        path,
        content.replace(replaceTextInput.oldText, () => replaceTextInput.newText),
        'utf8',
      );

      return replaceTextInput.relativePath;
    });
  }
}
