import type {PatkaPromptDirective} from './patka-prompt-directive.ts';

export class DefaultPatkaPromptDirective<PromptEnvironment>
  implements PatkaPromptDirective<PromptEnvironment>
{
  readonly name: string;
  readonly purpose: string;
  readonly children: ReadonlyArray<PatkaPromptDirective<PromptEnvironment>>;
  private readonly text: string;

  constructor(
    name: string,
    purpose: string,
    text: string,
    children: ReadonlyArray<PatkaPromptDirective<PromptEnvironment>> = [],
  ) {
    this.name = name;
    this.purpose = purpose;
    this.text = text;
    this.children = children;
  }

  render(): string {
    return this.text;
  }
}
