import defaultPatkaText from './default.json' with {type: 'json'};

export type PatkaTextKey = keyof typeof defaultPatkaText;

const PLACEHOLDER = /\{(\w+)\}/g;

export function createTextFromPatkaTextKey(
  patkaTextKey: PatkaTextKey,
  values: Readonly<Record<string, string>> = {},
): string {
  return defaultPatkaText[patkaTextKey].replace(
    PLACEHOLDER,
    (placeholder: string, key: string) => values[key] ?? placeholder,
  );
}
