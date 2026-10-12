export interface PatkaPromptDirective<PromptEnvironment> {
  readonly name: string;
  readonly purpose: string;
  readonly children: ReadonlyArray<PatkaPromptDirective<PromptEnvironment>>;
  render(promptEnvironment: PromptEnvironment): string;
}
