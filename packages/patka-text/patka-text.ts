export type PatkaDictionary = Readonly<Record<string, string>>;

const PLACEHOLDER = /\{(\w+)\}/g;

export class PatkaText {
  private readonly patkaDictionary: PatkaDictionary;

  constructor(patkaDictionary: PatkaDictionary) {
    this.patkaDictionary = patkaDictionary;
  }

  get(key: string, values: Readonly<Record<string, string>> = {}): string {
    const text: string | undefined = this.patkaDictionary[key];

    if (text === undefined) {
      throw new Error(`The dictionary has no text for the key: ${key}`);
    }

    return text.replace(
      PLACEHOLDER,
      (placeholder: string, name: string) => values[name] ?? placeholder,
    );
  }
}
