import defaultPatkaDictionary from './default.json' with {type: 'json'};

export {defaultPatkaDictionary};

export type PatkaTextKey = keyof typeof defaultPatkaDictionary;

export type PatkaDictionary = Readonly<Record<PatkaTextKey, string>>;

const PLACEHOLDER = /\{(\w+)\}/g;

export class PatkaText {
  private readonly patkaDictionary: PatkaDictionary;

  constructor(patkaDictionary: PatkaDictionary) {
    this.patkaDictionary = patkaDictionary;
  }

  get(patkaTextKey: PatkaTextKey, values: Readonly<Record<string, string>> = {}): string {
    return this.patkaDictionary[patkaTextKey].replace(
      PLACEHOLDER,
      (placeholder: string, key: string) => values[key] ?? placeholder,
    );
  }
}
